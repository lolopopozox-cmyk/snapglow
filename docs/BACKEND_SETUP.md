# Snap Glow — Backend Setup (Supabase upgrade path)

The shipped build runs in **demo mode** (`BACKEND_MODE = 'demo'` in
`src/lib/store.ts`): all data lives in the browser's localStorage. This
document describes how to upgrade to a real backend **without rewriting the
UI**: implement the same `SnapGlowApi` surface (see `src/lib/store.ts`)
against Supabase, then flip the mode.

> Estimated difficulty: intermediate. You need a Supabase account (free tier
> is fine) and somewhere to deploy the site (Vercel/Netlify/etc.).

## 1. Architecture

```
Browser (React) ──anon key──▶ Supabase (Postgres + Auth + Storage)
                                    ▲
Scheduled battle finalizer ─────────┘ (pg_cron or Edge Function on a schedule)
```

- The frontend keeps calling `useSnapGlow()`; only `src/lib/store.ts` (and a
  new `src/lib/supabase.ts`) changes.
- **Never** put the Supabase **service-role key** in frontend code or `.env`
  files that ship to browsers. It stays in server-side functions only.
- Demo-mode conveniences that must NOT ship to production: trusting
  frontend vote totals, `localStorage` persistence, username-only identity.

## 2. Create the project

1. Sign up at https://supabase.com and create a new project.
2. In *Project Settings → API* copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
3. Copy `.env.example` to `.env` and fill the two values (local dev), and
   add the same variables in your hosting provider's dashboard (production).

## 3. Database schema

Run this in the Supabase SQL editor (it is idempotent — safe to re-run):

```sql
-- Profiles (one row per auth user)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name text not null check (char_length(display_name) between 2 and 40),
  bio text not null default '' check (char_length(bio) <= 160),
  hue int not null default 160,
  created_at timestamptz not null default now()
);

-- Flex cards
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 40),
  caption text not null default '' check (char_length(caption) <= 140),
  template text not null,
  image_path text,                       -- storage path, null = generative art
  art_seed text not null,
  streak int not null default 0 check (streak between 0 and 9999),
  badges text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists cards_owner_idx on cards(owner_id);
create index if not exists cards_published_created_idx on cards(published, created_at desc);

-- Likes (one row per user per card — duplicates impossible)
create table if not exists card_likes (
  card_id uuid not null references cards(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

-- Posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  card_id uuid references cards(id) on delete set null,
  caption text not null check (char_length(caption) between 1 and 280),
  tags text[] not null default '{}',
  shares int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_author_idx on posts(author_id);
create index if not exists posts_created_idx on posts(created_at desc);

create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on comments(post_id, created_at);

-- Follows
create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Battles
create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 60),
  card_a_id uuid not null references cards(id) on delete restrict,
  card_b_id uuid not null references cards(id) on delete restrict,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'live' check (status in ('live','ended')),
  winner text check (winner in ('a','b','tie')),
  finalized_at timestamptz,
  check (card_a_id <> card_b_id)
);
create index if not exists battles_status_ends_idx on battles(status, ends_at);

-- Votes: one per user per battle, enforced by the PRIMARY KEY.
-- Voting window is enforced server-side (RPC checks ends_at).
create table if not exists votes (
  battle_id uuid not null references battles(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  side text not null check (side in ('a','b')),
  created_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);

-- Reports (moderation queue)
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  target_type text not null check (target_type in ('post','card','user','battle')),
  target_id uuid not null,
  reason text not null,
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','reviewed','actioned','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on reports(status, created_at desc);

-- Admins + audit log (role checks are SERVER-SIDE, never a frontend flag)
create table if not exists admins (
  user_id uuid primary key references profiles(id) on delete cascade,
  granted_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  reason text,
  created_at timestamptz not null default now()
);
```

## 4. Row Level Security (RLS)

Enable RLS on every table, then add policies. Public reads only expose
intended fields (never emails — those live in `auth.users`, untouched).

```sql
alter table profiles enable row level security;
alter table cards enable row level security;
alter table card_likes enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;
alter table battles enable row level security;
alter table votes enable row level security;
alter table reports enable row level security;
alter table admins enable row level security;
alter table audit_log enable row level security;

-- Public read: published cards, all posts/comments, profiles, battles+votes tallies
create policy "public read profiles" on profiles for select using (true);
create policy "public read cards" on cards for select using (published = true);
create policy "public read posts" on posts for select using (true);
create policy "public read comments" on comments for select using (true);
create policy "public read battles" on battles for select using (true);
create policy "public read votes" on votes for select using (true);
create policy "public read follows" on follows for select using (true);
create policy "public read likes" on card_likes for select using (true);
create policy "public read post likes" on post_likes for select using (true);

-- Owners manage their own rows
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own cards" on cards for all using (auth.uid() = owner_id);
create policy "own posts" on posts for all using (auth.uid() = author_id);
create policy "own comments" on comments for all using (auth.uid() = author_id);

-- Likes/follows/votes: users insert/delete only their own rows
create policy "own card like" on card_likes for all using (auth.uid() = user_id);
create policy "own post like" on post_likes for all using (auth.uid() = user_id);
create policy "own follow" on follows for all using (auth.uid() = follower_id);

-- Anyone signed in can create a battle; only the server finalizes it
create policy "create battles" on battles for insert
  with check (auth.uid() = created_by and status = 'live');

-- Votes go through an RPC (below) so the window + duplicates are server-checked.
-- Reports: anyone signed in can file; only admins read/update.
create policy "file reports" on reports for insert with check (auth.uid() = reporter_id);
create policy "admins read reports" on reports for select
  using (exists (select 1 from admins where user_id = auth.uid()));
create policy "admins update reports" on reports for update
  using (exists (select 1 from admins where user_id = auth.uid()));
create policy "admins read audit" on audit_log for select
  using (exists (select 1 from admins where user_id = auth.uid()));
```

Vote RPC (prevents late/duplicate votes even if the client lies):

```sql
create or replace function cast_vote(p_battle uuid, p_side text)
returns void language plpgsql security definer as $$
begin
  if p_side not in ('a','b') then raise exception 'bad side'; end if;
  insert into votes (battle_id, user_id, side)
  select p_battle, auth.uid(), p_side
  from battles
  where id = p_battle and status = 'live' and ends_at > now();
  if not found then raise exception 'voting closed'; end if;
exception when unique_violation then
  raise exception 'already voted';
end $$;
```

## 5. Battle finalization (scheduled, idempotent)

A battle must finalize **even if no browser is open**. Use pg_cron (or a
scheduled Edge Function) every 5 minutes:

```sql
-- with pg_cron enabled:
select cron.schedule('finalize-battles', '*/5 * * * *', $$
  update battles b set
    status = 'ended',
    winner = case
      when (select count(*) from votes v where v.battle_id = b.id and v.side='a')
         > (select count(*) from votes v where v.battle_id = b.id and v.side='b') then 'a'
      when (select count(*) from votes v where v.battle_id = b.id and v.side='a')
         < (select count(*) from votes v where v.battle_id = b.id and v.side='b') then 'b'
      else 'tie' end,
    finalized_at = now()
  where b.status = 'live' and b.ends_at <= now();
$$);
```

The `where status='live'` guard makes it idempotent — re-running changes
nothing.

## 6. Storage (card uploads)

- Create a **public** bucket `card-images`.
- Policy: signed-in users can upload to `card-images/{auth.uid()}/…`; public
  can read. Validate size/type in the Edge upload or in the insert policy;
  keep the 5 MB client check too.
- Store the path in `cards.image_path`; serve via the public bucket URL.

## 7. Auth

- Supabase Auth with email magic links (no passwords to forget).
- On first sign-in, create the `profiles` row (trigger or client upsert).
- The demo's “username-only identity” must be retired — it is not secure.

## 8. Wiring the frontend

1. `npm install @supabase/supabase-js`
2. Add `src/lib/supabase.ts` exporting a client from the env vars.
3. Re-implement the `SnapGlowApi` surface from `src/lib/store.ts` with
   Supabase queries (same method names/signatures so pages don't change).
4. Set `BACKEND_MODE = 'supabase'` and update the demo ribbons/banners to
   reflect real data. Remove the seed-data fallback for production builds.

## 9. Admin access

- Grant: `insert into admins (user_id) values ('<uuid>');` (run in SQL
  editor — there is intentionally no UI for self-granting).
- Build the moderation UI **after** this: metrics from real queries, report
  queue with action/dismiss + reason, audit log writes on every action,
  confirm-before-delete. All role checks via the `admins` table (RLS),
  never a frontend flag.
