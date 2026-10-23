-- 0002: open challenges (any user may accept when opponent_id is null),
--       creator cancel, opponent capture on accept.

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
  if b.opponent_id is not null and b.opponent_id <> auth.uid() then
    raise exception 'Only the challenged creator can accept this battle.';
  end if;
  if b.created_by = auth.uid() then
    raise exception 'You cannot accept your own challenge.';
  end if;
  select * into c from public.cards where id = p_card;
  if c is null or c.owner_id <> auth.uid() or not c.published then
    raise exception 'Pick one of your own published cards.';
  end if;
  update public.battles
     set card_b_id = p_card,
         opponent_id = coalesce(b.opponent_id, auth.uid()),
         status = 'live',
         accepted_at = now(),
         ends_at = now() + (coalesce(p_hours, b.duration_hours) || ' hours')::interval
   where id = p_battle;
  return true;
end;
$$;

create or replace function public.cancel_battle(p_battle text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare b record;
begin
  select * into b from public.battles where id = p_battle for update;
  if b is null then raise exception 'Battle not found.'; end if;
  if b.status <> 'pending' then raise exception 'Only pending challenges can be cancelled.'; end if;
  if b.created_by <> auth.uid() then raise exception 'Only the challenger can cancel.'; end if;
  update public.battles set status = 'cancelled' where id = p_battle;
  return true;
end;
$$;

grant execute on function public.cancel_battle(text) to authenticated;
