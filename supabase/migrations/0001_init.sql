-- =====================================================================
-- Snap Glow — Supabase schema, RLS, RPCs (idempotent)
-- Project: eosmvlwziqwyfykczqbh
-- Auth: email/password (synthetic emails <username>@users.snapglow.site)
-- Ordering: tables -> views -> functions/triggers -> RLS -> storage -> grants
-- =====================================================================

-- ---------- TABLES -----------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name  text not null default 'New Creator' check (char_length(display_name) between 2 and 40),
  bio           text not null default '' check (char_length(bio) <= 160),
  hue           int  not null default 0 check (hue between 0 and 359),
  avatar        text,
  avatar_emoji  text,
  theme         text not null default 'classic',
  points        int  not null default 0,
  last_login_day date,
  is_demo       boolean not null default false,
  is_suspended  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.points_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  points     int  not null,
  reason     text not null,
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists idx_ledger_user on public.points_ledger (user_id, created_at desc);

create table if not exists public.admins (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now()
);

create table if not exists public.cards (
  id            text primary key,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  title         text not null default '' check (char_length(title) <= 60),
  caption       text not null default '' check (char_length(caption) <= 140),
  template      text not null default 'neon-flex',
  image_kind    text not null default 'art' check (image_kind in ('art','upload')),
  image_path    text,
  art_seed      int  not null default 1,
  streak        int  not null default 0 check (streak between 0 and 99999),
  streak_label  text not null default '' check (char_length(streak_label) <= 60),
  badges        text[] not null default '{}',
  challenge_day date,
  published     boolean not null default true,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_cards_owner on public.cards (owner_id, created_at desc);

create table if not exists public.card_likes (
  card_id    text not null references public.cards(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

create table if not exists public.profile_likes (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id),
  check (profile_id <> user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table if not exists public.posts (
  id         text primary key,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  card_id    text references public.cards(id) on delete set null,
  caption    text not null default '' check (char_length(caption) <= 280),
  tags       text[] not null default '{}',
  shares     int not null default 0,
  is_demo    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_posts_author on public.posts (author_id, created_at desc);

create table if not exists public.post_likes (
  post_id    text not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id         text primary key,
  post_id    text not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_post on public.comments (post_id, created_at);

create table if not exists public.battles (
  id              text primary key,
  title           text not null check (char_length(title) between 4 and 60),
  created_by      uuid not null references public.profiles(id) on delete cascade,
  card_a_id       text not null references public.cards(id) on delete cascade,
  card_b_id       text references public.cards(id) on delete cascade,
  opponent_id     uuid references public.profiles(id) on delete set null,
  status          text not null default 'live' check (status in ('pending','live','declined','ended','cancelled')),
  winner          text check (winner in ('a','b','tie') or winner is null),
  duration_hours  int not null default 12 check (duration_hours between 1 and 72),
  ends_at         timestamptz,
  accepted_at     timestamptz,
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  check (card_b_id is null or card_a_id <> card_b_id)
);
create index if not exists idx_battles_status on public.battles (status, ends_at);

create table if not exists public.votes (
  battle_id  text not null references public.battles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  side       text not null check (side in ('a','b')),
  created_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);
create index if not exists idx_votes_battle on public.votes (battle_id, side);

create table if not exists public.battle_comments (
  id         text primary key,
  battle_id  text not null references public.battles(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists idx_bcomments_battle on public.battle_comments (battle_id, created_at);

create table if not exists public.battle_likes (
  battle_id  text not null references public.battles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);

create table if not exists public.earned_badges (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists public.reports (
  id          text primary key,
  target_type text not null check (target_type in ('post','card','user','battle','comment')),
  target_id   text not null,
  reason      text not null,
  details     text not null default '',
  reporter_id uuid references public.profiles(id) on delete set null,
  status      text not null default 'open' check (status in ('open','reviewed','actioned','dismissed')),
  actioned_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid references public.profiles(id) on delete set null,
  action     text not null,
  target     text,
  details    jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.app_config (key, value) values
  ('points_rules', '{"card":10,"challenge":15,"comment":3,"vote":2,"battleCreate":5,"battleWin":25,"dailyLogin":5,"follow":2,"profileLike":2,"like":1}'::jsonb),
  ('level_thresholds', '[{"name":"Rising Star","minPoints":0},{"name":"Hot Creator","minPoints":100},{"name":"Superstar","minPoints":300},{"name":"Legend","minPoints":700}]'::jsonb)
on conflict (key) do nothing;

create table if not exists public.featured (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  note       text not null default '',
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

create or replace view public.weekly_points as
select user_id, sum(points) as points
from public.points_ledger
where created_at >= date_trunc('week', now())
group by user_id;

-- ---------- FUNCTIONS & TRIGGERS ---------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, hue, avatar_emoji)
  values (
    new.id,
    lower(new.raw_user_meta_data->>'username'),
    coalesce(nullif(new.raw_user_meta_data->>'displayName', ''), 'New Creator'),
    coalesce((new.raw_user_meta_data->>'hue')::int, 0),
    new.raw_user_meta_data->>'avatarEmoji'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.guard_profiles_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.points       := old.points;
    new.is_suspended := old.is_suspended;
    new.is_demo      := old.is_demo;
    new.username     := old.username;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_profiles on public.profiles;
create trigger trg_guard_profiles
  before update on public.profiles
  for each row execute function public.guard_profiles_update();

create or replace function public.award_points(p_user uuid, p_points int, p_reason text, p_ref text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  farmed_today int := 0;
begin
  if p_user is null or p_points <= 0 then return; end if;
  if p_reason in ('like','profile-like','follow') then
    select coalesce(sum(points),0) into farmed_today
    from public.points_ledger
    where user_id = p_user
      and reason in ('like','profile-like','follow')
      and created_at >= date_trunc('day', now());
    if farmed_today + p_points > 60 then return; end if;
  end if;
  insert into public.points_ledger (user_id, points, reason, ref) values (p_user, p_points, p_reason, p_ref);
  update public.profiles set points = points + p_points where id = p_user;
end;
$$;

create or replace function public.handle_card_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.published then
    perform public.award_points(new.owner_id, 10, 'card', new.id);
    if new.challenge_day is not null then
      perform public.award_points(new.owner_id, 15, 'challenge', new.id);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_card_points on public.cards;
create trigger trg_card_points
  after insert on public.cards
  for each row execute function public.handle_card_points();

create or replace function public.handle_card_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner uuid;
begin
  select owner_id into owner from public.cards where id = new.card_id;
  if owner is not null and owner <> new.user_id then
    perform public.award_points(owner, 1, 'like', new.card_id);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_card_like on public.card_likes;
create trigger trg_card_like after insert on public.card_likes
  for each row execute function public.handle_card_like();

create or replace function public.handle_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    perform public.award_points(owner, 1, 'like', new.post_id);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_post_like on public.post_likes;
create trigger trg_post_like after insert on public.post_likes
  for each row execute function public.handle_post_like();

create or replace function public.handle_profile_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_id <> new.user_id then
    perform public.award_points(new.profile_id, 2, 'profile-like', new.user_id::text);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profile_like on public.profile_likes;
create trigger trg_profile_like after insert on public.profile_likes
  for each row execute function public.handle_profile_like();

create or replace function public.handle_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_points(new.followee_id, 2, 'follow', new.follower_id::text);
  return new;
end;
$$;
drop trigger if exists trg_follow on public.follows;
create trigger trg_follow after insert on public.follows
  for each row execute function public.handle_follow();

create or replace function public.handle_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.author_id then
    perform public.award_points(owner, 1, 'comment', new.post_id);
  end if;
  perform public.award_points(new.author_id, 3, 'comment', new.post_id);
  return new;
end;
$$;
drop trigger if exists trg_comment on public.comments;
create trigger trg_comment after insert on public.comments
  for each row execute function public.handle_comment();

create or replace function public.block_self_card_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner uuid;
begin
  select owner_id into owner from public.cards where id = new.card_id;
  if owner = new.user_id then
    raise exception 'You cannot like your own card.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_block_self_card_like on public.card_likes;
create trigger trg_block_self_card_like before insert on public.card_likes
  for each row execute function public.block_self_card_like();

create or replace function public.handle_battle_create()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_points(new.created_by, 5, 'battle-create', new.id);
  return new;
end;
$$;
drop trigger if exists trg_battle_create on public.battles;
create trigger trg_battle_create after insert on public.battles
  for each row execute function public.handle_battle_create();

create or replace function public.cast_vote(p_battle text, p_side text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare b record;
begin
  if auth.uid() is null then raise exception 'Sign in to vote.'; end if;
  if p_side not in ('a','b') then raise exception 'Invalid side.'; end if;
  select * into b from public.battles where id = p_battle for update;
  if b is null then raise exception 'Battle not found.'; end if;
  if b.status <> 'live' then raise exception 'This battle is no longer live.'; end if;
  if b.ends_at is not null and b.ends_at <= now() then raise exception 'Voting has ended for this battle.'; end if;
  if exists (select 1 from public.votes v where v.battle_id = p_battle and v.user_id = auth.uid()) then
    raise exception 'You already voted in this battle.';
  end if;
  insert into public.votes (battle_id, user_id, side) values (p_battle, auth.uid(), p_side);
  perform public.award_points(auth.uid(), 2, 'vote', p_battle);
  return true;
end;
$$;

create or replace function public.accept_challenge(p_battle text, p_card text, p_hours int default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare b record; c record;
begin
  select * into b from public.battles where id = p_battle for update;
  if b is null then raise exception 'Battle not found.'; end if;
  if b.status <> 'pending' then raise exception 'This challenge is no longer pending.'; end if;
  if b.opponent_id is null or b.opponent_id <> auth.uid() then
    raise exception 'Only the challenged creator can accept this battle.';
  end if;
  select * into c from public.cards where id = p_card;
  if c is null or c.owner_id <> auth.uid() or not c.published then
    raise exception 'Pick one of your own published cards.';
  end if;
  update public.battles
     set card_b_id = p_card,
         status = 'live',
         accepted_at = now(),
         ends_at = now() + (coalesce(p_hours, b.duration_hours) || ' hours')::interval
   where id = p_battle;
  return true;
end;
$$;

create or replace function public.reject_challenge(p_battle text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare b record;
begin
  select * into b from public.battles where id = p_battle for update;
  if b is null then raise exception 'Battle not found.'; end if;
  if b.status <> 'pending' then raise exception 'This challenge is no longer pending.'; end if;
  if b.opponent_id is null or b.opponent_id <> auth.uid() then
    raise exception 'Only the challenged creator can respond to this challenge.';
  end if;
  update public.battles set status = 'declined' where id = p_battle;
  return true;
end;
$$;

create or replace function public.finalize_battles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare done int := 0; b record; va int; vb int; win text; wowner uuid;
begin
  for b in select * from public.battles
            where status = 'live' and ends_at is not null and ends_at <= now()
            order by ends_at limit 200
  loop
    select count(*) into va from public.votes where battle_id = b.id and side = 'a';
    select count(*) into vb from public.votes where battle_id = b.id and side = 'b';
    win := case when va > vb then 'a' when vb > va then 'b' else 'tie' end;
    update public.battles set status = 'ended', winner = win where id = b.id;
    if win in ('a','b') then
      select owner_id into wowner from public.cards
       where id = case when win = 'a' then b.card_a_id else b.card_b_id end;
      if wowner is not null then
        perform public.award_points(wowner, 25, 'battle-win', b.id);
      end if;
    end if;
    done := done + 1;
  end loop;
  return done;
end;
$$;

create or replace function public.claim_daily_login()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and last_login_day = current_date) then
    return false;
  end if;
  update public.profiles set last_login_day = current_date where id = auth.uid();
  perform public.award_points(auth.uid(), 5, 'daily-login');
  return true;
end;
$$;

-- ---------- ROW LEVEL SECURITY -----------------------------------------

alter table public.profiles        enable row level security;
alter table public.points_ledger   enable row level security;
alter table public.cards           enable row level security;
alter table public.card_likes      enable row level security;
alter table public.profile_likes   enable row level security;
alter table public.follows         enable row level security;
alter table public.posts           enable row level security;
alter table public.post_likes      enable row level security;
alter table public.comments        enable row level security;
alter table public.battles         enable row level security;
alter table public.votes           enable row level security;
alter table public.battle_comments enable row level security;
alter table public.battle_likes    enable row level security;
alter table public.earned_badges   enable row level security;
alter table public.reports         enable row level security;
alter table public.admins          enable row level security;
alter table public.audit_log       enable row level security;
alter table public.app_config      enable row level security;
alter table public.featured        enable row level security;

drop policy if exists read_profiles on public.profiles;
create policy read_profiles on public.profiles for select using (true);
drop policy if exists update_profiles on public.profiles;
create policy update_profiles on public.profiles for update using (auth.uid() = id or public.is_admin());
drop policy if exists admin_delete_profiles on public.profiles;
create policy admin_delete_profiles on public.profiles for delete using (public.is_admin());

drop policy if exists read_ledger on public.points_ledger;
create policy read_ledger on public.points_ledger for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists read_cards on public.cards;
create policy read_cards on public.cards for select using (published or owner_id = auth.uid() or public.is_admin());
drop policy if exists insert_cards on public.cards;
create policy insert_cards on public.cards for insert with check (owner_id = auth.uid() and not is_demo);
drop policy if exists update_cards on public.cards;
create policy update_cards on public.cards for update using (owner_id = auth.uid() or public.is_admin());
drop policy if exists delete_cards on public.cards;
create policy delete_cards on public.cards for delete using (owner_id = auth.uid() or public.is_admin());

drop policy if exists read_card_likes on public.card_likes;
create policy read_card_likes on public.card_likes for select using (true);
drop policy if exists insert_card_likes on public.card_likes;
create policy insert_card_likes on public.card_likes for insert with check (auth.uid() = user_id);
drop policy if exists delete_card_likes on public.card_likes;
create policy delete_card_likes on public.card_likes for delete using (auth.uid() = user_id);

drop policy if exists read_profile_likes on public.profile_likes;
create policy read_profile_likes on public.profile_likes for select using (true);
drop policy if exists insert_profile_likes on public.profile_likes;
create policy insert_profile_likes on public.profile_likes for insert with check (auth.uid() = user_id);
drop policy if exists delete_profile_likes on public.profile_likes;
create policy delete_profile_likes on public.profile_likes for delete using (auth.uid() = user_id);

drop policy if exists read_follows on public.follows;
create policy read_follows on public.follows for select using (true);
drop policy if exists insert_follows on public.follows;
create policy insert_follows on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists delete_follows on public.follows;
create policy delete_follows on public.follows for delete using (auth.uid() = follower_id);

drop policy if exists read_posts on public.posts;
create policy read_posts on public.posts for select using (true);
drop policy if exists insert_posts on public.posts;
create policy insert_posts on public.posts for insert with check (author_id = auth.uid() and not is_demo);
drop policy if exists update_posts on public.posts;
create policy update_posts on public.posts for update using (author_id = auth.uid() or public.is_admin());
drop policy if exists delete_posts on public.posts;
create policy delete_posts on public.posts for delete using (author_id = auth.uid() or public.is_admin());

drop policy if exists read_post_likes on public.post_likes;
create policy read_post_likes on public.post_likes for select using (true);
drop policy if exists insert_post_likes on public.post_likes;
create policy insert_post_likes on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists delete_post_likes on public.post_likes;
create policy delete_post_likes on public.post_likes for delete using (auth.uid() = user_id);

drop policy if exists read_comments on public.comments;
create policy read_comments on public.comments for select using (true);
drop policy if exists insert_comments on public.comments;
create policy insert_comments on public.comments for insert with check (auth.uid() = author_id);
drop policy if exists delete_comments on public.comments;
create policy delete_comments on public.comments for delete using (auth.uid() = author_id or public.is_admin());

drop policy if exists read_battles on public.battles;
create policy read_battles on public.battles for select using (true);
drop policy if exists insert_battles on public.battles;
create policy insert_battles on public.battles for insert with check (
  auth.uid() = created_by
  and status in ('pending','live')
  and (card_b_id is not null or opponent_id is not null)
);
drop policy if exists update_battles on public.battles;
create policy update_battles on public.battles for update using (public.is_admin());
drop policy if exists delete_battles on public.battles;
create policy delete_battles on public.battles for delete using (public.is_admin() or (auth.uid() = created_by and status = 'pending'));

drop policy if exists read_votes on public.votes;
create policy read_votes on public.votes for select using (true);

drop policy if exists read_bcomments on public.battle_comments;
create policy read_bcomments on public.battle_comments for select using (true);
drop policy if exists insert_bcomments on public.battle_comments;
create policy insert_bcomments on public.battle_comments for insert with check (auth.uid() = author_id);
drop policy if exists delete_bcomments on public.battle_comments;
create policy delete_bcomments on public.battle_comments for delete using (auth.uid() = author_id or public.is_admin());

drop policy if exists read_blikes on public.battle_likes;
create policy read_blikes on public.battle_likes for select using (true);
drop policy if exists insert_blikes on public.battle_likes;
create policy insert_blikes on public.battle_likes for insert with check (auth.uid() = user_id);
drop policy if exists delete_blikes on public.battle_likes;
create policy delete_blikes on public.battle_likes for delete using (auth.uid() = user_id);

drop policy if exists read_badges on public.earned_badges;
create policy read_badges on public.earned_badges for select using (true);
drop policy if exists insert_badges on public.earned_badges;
create policy insert_badges on public.earned_badges for insert with check (auth.uid() = user_id);
drop policy if exists delete_badges on public.earned_badges;
create policy delete_badges on public.earned_badges for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists insert_reports on public.reports;
create policy insert_reports on public.reports for insert with check (reporter_id = auth.uid());
drop policy if exists read_reports on public.reports;
create policy read_reports on public.reports for select using (public.is_admin());
drop policy if exists update_reports on public.reports;
create policy update_reports on public.reports for update using (public.is_admin());

drop policy if exists read_own_admin on public.admins;
create policy read_own_admin on public.admins for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists read_audit on public.audit_log;
create policy read_audit on public.audit_log for select using (public.is_admin());
drop policy if exists write_audit on public.audit_log;
create policy write_audit on public.audit_log for insert with check (public.is_admin());

drop policy if exists read_config on public.app_config;
create policy read_config on public.app_config for select using (true);
drop policy if exists write_config on public.app_config;
create policy write_config on public.app_config for update using (public.is_admin());
drop policy if exists insert_config on public.app_config;
create policy insert_config on public.app_config for insert with check (public.is_admin());

drop policy if exists read_featured on public.featured;
create policy read_featured on public.featured for select using (true);
drop policy if exists write_featured on public.featured;
create policy write_featured on public.featured for update using (public.is_admin());
drop policy if exists insert_featured on public.featured;
create policy insert_featured on public.featured for insert with check (public.is_admin());
drop policy if exists delete_featured on public.featured;
create policy delete_featured on public.featured for delete using (public.is_admin());

-- ---------- STORAGE ----------------------------------------------------

insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

drop policy if exists "public read card images" on storage.objects;
create policy "public read card images"
on storage.objects for select
using (bucket_id = 'card-images');

drop policy if exists "owner upload card images" on storage.objects;
create policy "owner upload card images"
on storage.objects for insert
with check (bucket_id = 'card-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "owner update card images" on storage.objects;
create policy "owner update card images"
on storage.objects for update
using (bucket_id = 'card-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "owner delete card images" on storage.objects;
create policy "owner delete card images"
on storage.objects for delete
using (bucket_id = 'card-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- GRANTS -----------------------------------------------------

grant select on public.weekly_points to anon, authenticated;
grant execute on function public.cast_vote(text, text) to authenticated;
grant execute on function public.accept_challenge(text, text, int) to authenticated;
grant execute on function public.reject_challenge(text) to authenticated;
grant execute on function public.finalize_battles() to anon, authenticated;
grant execute on function public.claim_daily_login() to authenticated;
