-- 0005: allow server-context (service role / auth.uid() IS NULL) profile
-- updates through the guard. Real users always have auth.uid(); only
-- trusted server calls (admin API, seeding, migrations) have NULL.

create or replace function public.guard_profiles_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.points       := old.points;
    new.is_suspended := old.is_suspended;
    new.is_demo      := old.is_demo;
    new.username     := old.username;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
