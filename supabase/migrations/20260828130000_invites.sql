create table public.invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  family_id uuid not null references public.families (id),
  token text not null,
  expires_at timestamptz not null default now() + interval '7 days',
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0,
  revoked boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create unique index invites_token_idx on public.invites (token);
create index invites_family_id_idx on public.invites (family_id);

create trigger lww_touch before update on public.invites
  for each row execute function public.lww_touch();

alter table public.invites enable row level security;

create policy invites_select on public.invites for select to authenticated
  using (family_id = public.my_family_id() and public.my_family_role() = 'owner');
create policy invites_insert on public.invites for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and family_id = public.my_family_id()
    and public.my_family_role() = 'owner'
  );
create policy invites_update on public.invites for update to authenticated
  using (family_id = public.my_family_id() and public.my_family_role() = 'owner')
  with check (family_id = public.my_family_id() and public.my_family_role() = 'owner');

create or replace function public.accept_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_invite public.invites%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  select * into v_invite
  from public.invites
  where token = p_token
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_invite.deleted or v_invite.revoked then
    return jsonb_build_object('ok', false, 'reason', 'revoked');
  end if;

  if v_invite.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_invite.max_uses is not null and v_invite.uses >= v_invite.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'exhausted');
  end if;

  if exists (
    select 1 from public.family_members fm
    where fm.user_id = v_user and not fm.deleted
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_in_family');
  end if;

  insert into public.family_members (owner_id, family_id, user_id, role)
  values (v_user, v_invite.family_id, v_user, 'member');

  update public.invites
  set uses = uses + 1
  where id = v_invite.id;

  return jsonb_build_object('ok', true, 'family_id', v_invite.family_id);
end;
$$;

revoke execute on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

grant select, insert, update on public.invites to authenticated;
