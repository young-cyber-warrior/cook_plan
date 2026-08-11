create or replace function public.lww_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  col text;
  times jsonb;
begin
  new.id := old.id;
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.updated_at := now();

  old_row := to_jsonb(old);
  new_row := to_jsonb(new);
  times := coalesce(old.field_times, '{}'::jsonb);

  for col in select jsonb_object_keys(new_row) loop
    if col in ('id', 'owner_id', 'created_at', 'updated_at', 'field_times') then
      continue;
    end if;
    if old_row -> col is distinct from new_row -> col then
      times := jsonb_set(times, array[col], to_jsonb(now()));
    end if;
  end loop;

  new.field_times := times;
  return new;
end;
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  slug text not null,
  label text not null,
  position integer not null default 0,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index categories_owner_id_idx on public.categories (owner_id);
create unique index categories_owner_slug_idx on public.categories (owner_id, slug) where not deleted;

create trigger lww_touch before update on public.categories
  for each row execute function public.lww_touch();

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  category_id uuid not null references public.categories (id),
  title text not null,
  description text not null default '',
  photos jsonb not null default '[]'::jsonb,
  calories numeric not null default 0,
  protein numeric not null default 0,
  fat numeric not null default 0,
  carbs numeric not null default 0,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index recipes_owner_id_idx on public.recipes (owner_id);
create index recipes_category_id_idx on public.recipes (category_id);

create trigger lww_touch before update on public.recipes
  for each row execute function public.lww_touch();

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  recipe_id uuid not null references public.recipes (id),
  name text not null,
  amount numeric not null check (amount >= 0),
  unit text not null check (unit in ('g', 'ml')),
  position integer not null default 0,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);

create trigger lww_touch before update on public.recipe_ingredients
  for each row execute function public.lww_touch();

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  start_date date not null,
  end_date date not null,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb,
  check (end_date >= start_date and end_date - start_date < 7)
);

create index weeks_owner_id_idx on public.weeks (owner_id);

create trigger lww_touch before update on public.weeks
  for each row execute function public.lww_touch();

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  week_id uuid not null references public.weeks (id),
  day date not null,
  title text not null,
  category text not null check (category in ('breakfast', 'lunch', 'dinner', 'snack')),
  servings integer not null default 2 check (servings between 1 and 20),
  recipe_id uuid references public.recipes (id),
  position integer not null default 0,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index meals_week_id_idx on public.meals (week_id);
create index meals_recipe_id_idx on public.meals (recipe_id);

create trigger lww_touch before update on public.meals
  for each row execute function public.lww_touch();

create table public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  week_ids jsonb not null default '[]'::jsonb,
  source_hash text not null default '',
  recipe_count integer not null default 0,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index grocery_lists_owner_id_idx on public.grocery_lists (owner_id);

create trigger lww_touch before update on public.grocery_lists
  for each row execute function public.lww_touch();

create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  list_id uuid not null references public.grocery_lists (id),
  name text not null,
  amount numeric not null check (amount >= 0),
  unit text not null check (unit in ('g', 'ml')),
  checked boolean not null default false,
  edited boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index grocery_items_list_id_idx on public.grocery_items (list_id);

create trigger lww_touch before update on public.grocery_items
  for each row execute function public.lww_touch();

create table public.shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  resource_type text not null check (resource_type in ('week', 'recipe', 'grocery_list')),
  resource_id uuid not null,
  user_id uuid not null references auth.users (id),
  role text not null check (role in ('editor', 'viewer')),
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index shares_user_id_idx on public.shares (user_id);
create unique index shares_resource_user_idx on public.shares (resource_type, resource_id, user_id) where not deleted;

create trigger lww_touch before update on public.shares
  for each row execute function public.lww_touch();

create or replace function public.is_shared_with_me(p_type text, p_id uuid, p_edit boolean)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.shares s
    where s.resource_type = p_type
      and s.resource_id = p_id
      and s.user_id = (select auth.uid())
      and not s.deleted
      and (not p_edit or s.role = 'editor')
  );
$$;

create or replace function public.owns_resource(p_type text, p_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case p_type
    when 'week' then exists (
      select 1 from public.weeks w where w.id = p_id and w.owner_id = (select auth.uid())
    )
    when 'recipe' then exists (
      select 1 from public.recipes r where r.id = p_id and r.owner_id = (select auth.uid())
    )
    when 'grocery_list' then exists (
      select 1 from public.grocery_lists g where g.id = p_id and g.owner_id = (select auth.uid())
    )
    else false
  end;
$$;

alter table public.categories enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.weeks enable row level security;
alter table public.meals enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;
alter table public.shares enable row level security;

create policy categories_select on public.categories for select to authenticated
  using (owner_id = (select auth.uid()));
create policy categories_insert on public.categories for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy categories_update on public.categories for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy recipes_select on public.recipes for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_shared_with_me('recipe', id, false));
create policy recipes_insert on public.recipes for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy recipes_update on public.recipes for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_shared_with_me('recipe', id, true))
  with check (owner_id = (select auth.uid()) or public.is_shared_with_me('recipe', id, true));

create policy recipe_ingredients_select on public.recipe_ingredients for select to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));
create policy recipe_ingredients_insert on public.recipe_ingredients for insert to authenticated
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_id
      and r.owner_id = recipe_ingredients.owner_id
      and (r.owner_id = (select auth.uid()) or public.is_shared_with_me('recipe', r.id, true))
  ));
create policy recipe_ingredients_update on public.recipe_ingredients for update to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id
      and (r.owner_id = (select auth.uid()) or public.is_shared_with_me('recipe', r.id, true))
  ))
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_id
      and r.owner_id = recipe_ingredients.owner_id
      and (r.owner_id = (select auth.uid()) or public.is_shared_with_me('recipe', r.id, true))
  ));

create policy weeks_select on public.weeks for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_shared_with_me('week', id, false));
create policy weeks_insert on public.weeks for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy weeks_update on public.weeks for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_shared_with_me('week', id, true))
  with check (owner_id = (select auth.uid()) or public.is_shared_with_me('week', id, true));

create policy meals_select on public.meals for select to authenticated
  using (exists (select 1 from public.weeks w where w.id = week_id));
create policy meals_insert on public.meals for insert to authenticated
  with check (exists (
    select 1 from public.weeks w
    where w.id = week_id
      and w.owner_id = meals.owner_id
      and (w.owner_id = (select auth.uid()) or public.is_shared_with_me('week', w.id, true))
  ));
create policy meals_update on public.meals for update to authenticated
  using (exists (
    select 1 from public.weeks w
    where w.id = week_id
      and (w.owner_id = (select auth.uid()) or public.is_shared_with_me('week', w.id, true))
  ))
  with check (exists (
    select 1 from public.weeks w
    where w.id = week_id
      and w.owner_id = meals.owner_id
      and (w.owner_id = (select auth.uid()) or public.is_shared_with_me('week', w.id, true))
  ));

create policy grocery_lists_select on public.grocery_lists for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_shared_with_me('grocery_list', id, false));
create policy grocery_lists_insert on public.grocery_lists for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy grocery_lists_update on public.grocery_lists for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_shared_with_me('grocery_list', id, true))
  with check (owner_id = (select auth.uid()) or public.is_shared_with_me('grocery_list', id, true));

create policy grocery_items_select on public.grocery_items for select to authenticated
  using (exists (select 1 from public.grocery_lists g where g.id = list_id));
create policy grocery_items_insert on public.grocery_items for insert to authenticated
  with check (exists (
    select 1 from public.grocery_lists g
    where g.id = list_id
      and g.owner_id = grocery_items.owner_id
      and (g.owner_id = (select auth.uid()) or public.is_shared_with_me('grocery_list', g.id, true))
  ));
create policy grocery_items_update on public.grocery_items for update to authenticated
  using (exists (
    select 1 from public.grocery_lists g
    where g.id = list_id
      and (g.owner_id = (select auth.uid()) or public.is_shared_with_me('grocery_list', g.id, true))
  ))
  with check (exists (
    select 1 from public.grocery_lists g
    where g.id = list_id
      and g.owner_id = grocery_items.owner_id
      and (g.owner_id = (select auth.uid()) or public.is_shared_with_me('grocery_list', g.id, true))
  ));

create policy shares_select on public.shares for select to authenticated
  using ((select auth.uid()) in (owner_id, user_id));
create policy shares_insert on public.shares for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.owns_resource(resource_type, resource_id));
create policy shares_update on public.shares for update to authenticated
  using ((select auth.uid()) in (owner_id, user_id))
  with check (owner_id = (select auth.uid()) or (user_id = (select auth.uid()) and deleted));

grant select, insert, update on all tables in schema public to authenticated;
