create table public.families (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  name text not null default '',
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index families_owner_id_idx on public.families (owner_id);

create trigger lww_touch before update on public.families
  for each row execute function public.lww_touch();

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  family_id uuid not null references public.families (id),
  user_id uuid not null references auth.users (id),
  role text not null check (role in ('owner', 'member')),
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index family_members_family_id_idx on public.family_members (family_id);
create unique index family_members_user_idx on public.family_members (user_id) where not deleted;

create trigger lww_touch before update on public.family_members
  for each row execute function public.lww_touch();

create or replace function public.my_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select fm.family_id
  from public.family_members fm
  where fm.user_id = (select auth.uid())
    and not fm.deleted
  limit 1;
$$;

create or replace function public.my_family_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select fm.role
  from public.family_members fm
  where fm.user_id = (select auth.uid())
    and not fm.deleted
  limit 1;
$$;

create or replace function public.can_read_owner(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_owner = (select auth.uid())
    or exists (
      select 1
      from public.family_members fm
      where fm.user_id = p_owner
        and not fm.deleted
        and fm.family_id = public.my_family_id()
    );
$$;

create or replace function public.can_write_owner(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_read_owner(p_owner);
$$;

alter table public.families enable row level security;
alter table public.family_members enable row level security;

create policy families_select on public.families for select to authenticated
  using (id = public.my_family_id() or owner_id = (select auth.uid()));
create policy families_insert on public.families for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.my_family_id() is null);
create policy families_update on public.families for update to authenticated
  using (id = public.my_family_id() and public.my_family_role() = 'owner')
  with check (id = public.my_family_id() and public.my_family_role() = 'owner');

create policy family_members_select on public.family_members for select to authenticated
  using (family_id = public.my_family_id());
create policy family_members_insert on public.family_members for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1 from public.families f
      where f.id = family_id and f.owner_id = (select auth.uid())
    )
  );
create policy family_members_update on public.family_members for update to authenticated
  using (
    user_id = (select auth.uid())
    or (family_id = public.my_family_id() and public.my_family_role() = 'owner')
  )
  with check (
    user_id = (select auth.uid())
    or (family_id = public.my_family_id() and public.my_family_role() = 'owner')
  );

drop policy categories_select on public.categories;
drop policy categories_update on public.categories;

create policy categories_select on public.categories for select to authenticated
  using (
    public.can_read_owner(owner_id)
    or exists (
      select 1 from public.recipes r
      where r.category_id = categories.id and not r.deleted
    )
  );
create policy categories_update on public.categories for update to authenticated
  using (public.can_write_owner(owner_id))
  with check (public.can_write_owner(owner_id));

drop policy recipes_select on public.recipes;
drop policy recipes_update on public.recipes;

create policy recipes_select on public.recipes for select to authenticated
  using (public.can_read_owner(owner_id) or public.is_shared_with_me('recipe', id, false));
create policy recipes_update on public.recipes for update to authenticated
  using (public.can_write_owner(owner_id) or public.is_shared_with_me('recipe', id, true))
  with check (public.can_write_owner(owner_id) or public.is_shared_with_me('recipe', id, true));

drop policy recipe_ingredients_insert on public.recipe_ingredients;
drop policy recipe_ingredients_update on public.recipe_ingredients;

create policy recipe_ingredients_insert on public.recipe_ingredients for insert to authenticated
  with check (
    public.can_write_owner(recipe_ingredients.owner_id)
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (public.can_write_owner(r.owner_id) or public.is_shared_with_me('recipe', r.id, true))
    )
  );
create policy recipe_ingredients_update on public.recipe_ingredients for update to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id
      and (public.can_write_owner(r.owner_id) or public.is_shared_with_me('recipe', r.id, true))
  ))
  with check (
    public.can_write_owner(recipe_ingredients.owner_id)
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (public.can_write_owner(r.owner_id) or public.is_shared_with_me('recipe', r.id, true))
    )
  );

drop policy weeks_select on public.weeks;
drop policy weeks_update on public.weeks;

create policy weeks_select on public.weeks for select to authenticated
  using (public.can_read_owner(owner_id) or public.is_shared_with_me('week', id, false));
create policy weeks_update on public.weeks for update to authenticated
  using (public.can_write_owner(owner_id) or public.is_shared_with_me('week', id, true))
  with check (public.can_write_owner(owner_id) or public.is_shared_with_me('week', id, true));

drop policy meals_insert on public.meals;
drop policy meals_update on public.meals;

create policy meals_insert on public.meals for insert to authenticated
  with check (
    public.can_write_owner(meals.owner_id)
    and exists (
      select 1 from public.weeks w
      where w.id = week_id
        and (public.can_write_owner(w.owner_id) or public.is_shared_with_me('week', w.id, true))
    )
  );
create policy meals_update on public.meals for update to authenticated
  using (exists (
    select 1 from public.weeks w
    where w.id = week_id
      and (public.can_write_owner(w.owner_id) or public.is_shared_with_me('week', w.id, true))
  ))
  with check (
    public.can_write_owner(meals.owner_id)
    and exists (
      select 1 from public.weeks w
      where w.id = week_id
        and (public.can_write_owner(w.owner_id) or public.is_shared_with_me('week', w.id, true))
    )
  );

drop policy grocery_lists_select on public.grocery_lists;
drop policy grocery_lists_update on public.grocery_lists;

create policy grocery_lists_select on public.grocery_lists for select to authenticated
  using (public.can_read_owner(owner_id) or public.is_shared_with_me('grocery_list', id, false));
create policy grocery_lists_update on public.grocery_lists for update to authenticated
  using (public.can_write_owner(owner_id) or public.is_shared_with_me('grocery_list', id, true))
  with check (public.can_write_owner(owner_id) or public.is_shared_with_me('grocery_list', id, true));

drop policy grocery_items_insert on public.grocery_items;
drop policy grocery_items_update on public.grocery_items;

create policy grocery_items_insert on public.grocery_items for insert to authenticated
  with check (
    public.can_write_owner(grocery_items.owner_id)
    and exists (
      select 1 from public.grocery_lists g
      where g.id = list_id
        and (public.can_write_owner(g.owner_id) or public.is_shared_with_me('grocery_list', g.id, true))
    )
  );
create policy grocery_items_update on public.grocery_items for update to authenticated
  using (exists (
    select 1 from public.grocery_lists g
    where g.id = list_id
      and (public.can_write_owner(g.owner_id) or public.is_shared_with_me('grocery_list', g.id, true))
  ))
  with check (
    public.can_write_owner(grocery_items.owner_id)
    and exists (
      select 1 from public.grocery_lists g
      where g.id = list_id
        and (public.can_write_owner(g.owner_id) or public.is_shared_with_me('grocery_list', g.id, true))
    )
  );

grant select, insert, update on public.families to authenticated;
grant select, insert, update on public.family_members to authenticated;
