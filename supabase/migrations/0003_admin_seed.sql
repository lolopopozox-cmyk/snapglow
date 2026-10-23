-- 0003: grant admin rights to the provisioned operator account
-- (there is deliberately NO public admin signup; this insert is the
--  only way to become an administrator).

insert into public.admins (user_id)
select p.id from public.profiles p
where p.username = 'admin'
on conflict (user_id) do nothing;

-- mark QA/test accounts so they're clearly identifiable and removable
update public.profiles set is_demo = true
where username in ('qa_probe_1', 'smoke_test_1');
update public.cards set is_demo = true
where owner_id in (select id from public.profiles where is_demo);
update public.posts set is_demo = true
where author_id in (select id from public.profiles where is_demo);

-- remove the earliest throwaway probe created during auth testing
delete from auth.users where email = 'sg.signtest.9f2k1a@gmail.com';
