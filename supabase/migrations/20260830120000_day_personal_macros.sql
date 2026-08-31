create table public.meal_adjustments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  meal_id uuid not null references public.meals (id),
  servings integer,
  skipped boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb,
  constraint meal_adjustments_servings_range check (servings is null or servings between 1 and 20)
);

create index meal_adjustments_owner_id_idx on public.meal_adjustments (owner_id);
create unique index meal_adjustments_owner_meal_idx
  on public.meal_adjustments (owner_id, meal_id) where not deleted;

create trigger lww_touch before update on public.meal_adjustments
  for each row execute function public.lww_touch();

create table public.day_extras (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  week_id uuid not null references public.weeks (id),
  day date not null,
  name text not null default '',
  amount real not null default 0,
  unit text not null default '',
  calories real not null default 0,
  protein real not null default 0,
  fat real not null default 0,
  carbs real not null default 0,
  position integer not null default 0,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index day_extras_owner_day_idx on public.day_extras (owner_id, week_id, day);

create trigger lww_touch before update on public.day_extras
  for each row execute function public.lww_touch();

alter table public.meal_adjustments enable row level security;
alter table public.day_extras enable row level security;

create policy meal_adjustments_select on public.meal_adjustments for select to authenticated
  using (owner_id = (select auth.uid()));
create policy meal_adjustments_insert on public.meal_adjustments for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.meals m
      where m.id = meal_id and public.can_read_owner(m.owner_id)
    )
  );
create policy meal_adjustments_update on public.meal_adjustments for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy day_extras_select on public.day_extras for select to authenticated
  using (owner_id = (select auth.uid()));
create policy day_extras_insert on public.day_extras for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.weeks w
      where w.id = week_id and public.can_read_owner(w.owner_id)
    )
  );
create policy day_extras_update on public.day_extras for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

grant select, insert, update on public.meal_adjustments to authenticated;
grant select, insert, update on public.day_extras to authenticated;
