create table public.recipe_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  token text not null,
  payload jsonb not null,
  expires_at timestamptz not null default now() + interval '30 days',
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create unique index recipe_snapshots_token_idx on public.recipe_snapshots (token);
create index recipe_snapshots_owner_id_idx on public.recipe_snapshots (owner_id);

create trigger lww_touch before update on public.recipe_snapshots
  for each row execute function public.lww_touch();

alter table public.recipe_snapshots enable row level security;

create policy recipe_snapshots_select on public.recipe_snapshots for select to authenticated
  using (owner_id = (select auth.uid()));
create policy recipe_snapshots_insert on public.recipe_snapshots for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy recipe_snapshots_update on public.recipe_snapshots for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create or replace function public.preview_shared_recipe(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_snapshot public.recipe_snapshots%rowtype;
begin
  select * into v_snapshot from public.recipe_snapshots where token = p_token;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_snapshot.deleted then
    return jsonb_build_object('ok', false, 'reason', 'revoked');
  end if;

  if v_snapshot.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  return jsonb_build_object('ok', true, 'payload', v_snapshot.payload);
end;
$$;

create or replace function public.import_shared_recipe(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_snapshot public.recipe_snapshots%rowtype;
  v_payload jsonb;
  v_recipe jsonb;
  v_category jsonb;
  v_category_id uuid;
  v_recipe_id uuid := gen_random_uuid();
  v_item jsonb;
  v_index integer := 0;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  select * into v_snapshot from public.recipe_snapshots where token = p_token;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_snapshot.deleted then
    return jsonb_build_object('ok', false, 'reason', 'revoked');
  end if;

  if v_snapshot.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  v_payload := v_snapshot.payload;
  v_recipe := v_payload -> 'recipe';
  v_category := v_payload -> 'category';

  select c.id into v_category_id
  from public.categories c
  where c.owner_id = v_user
    and c.slug = (v_category ->> 'slug')
    and not c.deleted
  limit 1;

  if v_category_id is null then
    insert into public.categories (owner_id, slug, label, position)
    values (
      v_user,
      v_category ->> 'slug',
      coalesce(v_category ->> 'label', ''),
      coalesce(
        (select max(c.position) + 1 from public.categories c where c.owner_id = v_user and not c.deleted),
        0
      )
    )
    returning id into v_category_id;
  end if;

  insert into public.recipes (
    id, owner_id, category_id, title, description, calories, protein, fat, carbs
  )
  values (
    v_recipe_id,
    v_user,
    v_category_id,
    coalesce(v_recipe ->> 'title', ''),
    coalesce(v_recipe ->> 'description', ''),
    coalesce((v_recipe ->> 'calories')::numeric, 0),
    coalesce((v_recipe ->> 'protein')::numeric, 0),
    coalesce((v_recipe ->> 'fat')::numeric, 0),
    coalesce((v_recipe ->> 'carbs')::numeric, 0)
  );

  for v_item in
    select value from jsonb_array_elements(coalesce(v_payload -> 'ingredients', '[]'::jsonb))
  loop
    insert into public.recipe_ingredients (owner_id, recipe_id, name, amount, unit, position)
    values (
      v_user,
      v_recipe_id,
      coalesce(v_item ->> 'name', ''),
      coalesce((v_item ->> 'amount')::numeric, 0),
      coalesce(v_item ->> 'unit', 'g'),
      v_index
    );
    v_index := v_index + 1;
  end loop;

  v_index := 0;

  for v_item in
    select value from jsonb_array_elements(coalesce(v_payload -> 'photos', '[]'::jsonb))
  loop
    insert into public.recipe_photos (
      owner_id, recipe_id, storage_path, content_hash, width, height, bytes, position
    )
    values (
      v_user,
      v_recipe_id,
      v_item ->> 'storage_path',
      v_item ->> 'content_hash',
      coalesce((v_item ->> 'width')::integer, 0),
      coalesce((v_item ->> 'height')::integer, 0),
      coalesce((v_item ->> 'bytes')::integer, 0),
      v_index
    );
    v_index := v_index + 1;
  end loop;

  return jsonb_build_object('ok', true, 'recipe_id', v_recipe_id);
end;
$$;

revoke execute on function public.preview_shared_recipe(text) from public;
revoke execute on function public.import_shared_recipe(text) from public;
grant execute on function public.preview_shared_recipe(text) to authenticated;
grant execute on function public.import_shared_recipe(text) to authenticated;

grant select, insert, update on public.recipe_snapshots to authenticated;
