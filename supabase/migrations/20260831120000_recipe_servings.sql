alter table public.recipes
  add column servings integer not null default 1;

alter table public.recipes
  add constraint recipes_servings_check check (servings between 1 and 20);

comment on column public.recipes.servings is
  'How many servings the ingredient amounts add up to. Macros stay totals for the whole recipe.';

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
    id, owner_id, category_id, title, description, servings, calories, protein, fat, carbs
  )
  values (
    v_recipe_id,
    v_user,
    v_category_id,
    coalesce(v_recipe ->> 'title', ''),
    coalesce(v_recipe ->> 'description', ''),
    least(20, greatest(1, coalesce((v_recipe ->> 'servings')::integer, 1))),
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
