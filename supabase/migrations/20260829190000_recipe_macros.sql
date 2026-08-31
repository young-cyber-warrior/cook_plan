alter table public.recipes
  add column macros_status text not null default 'idle',
  add column macros_hash text,
  add column macros_error text,
  add column macros_updated_at timestamptz;

alter table public.recipes
  add constraint recipes_macros_status_check
  check (macros_status in ('idle', 'pending', 'ready', 'partial', 'failed'));

alter table public.recipe_ingredients
  add column recognized boolean not null default true,
  add column macro_note text;

create table public.recipe_macro_jobs (
  recipe_id uuid primary key references public.recipes (id) on delete cascade,
  hash text not null,
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipe_macro_jobs_run_after_idx on public.recipe_macro_jobs (run_after);

alter table public.recipe_macro_jobs enable row level security;

create or replace function public.recipe_ingredients_hash(p_recipe_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    md5(
      string_agg(
        lower(btrim(i.name)) || '|' || i.amount::text || '|' || i.unit,
        ';' order by i.position, i.id
      )
    ),
    ''
  )
  from public.recipe_ingredients i
  where i.recipe_id = p_recipe_id
    and not i.deleted
    and btrim(i.name) <> ''
    and i.amount > 0;
$$;

create or replace function public.queue_macro_estimate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid := coalesce(new.recipe_id, old.recipe_id);
  next_hash text;
  recipe public.recipes%rowtype;
begin
  select * into recipe from public.recipes r where r.id = target_id;

  if not found or recipe.deleted then
    return coalesce(new, old);
  end if;

  next_hash := public.recipe_ingredients_hash(target_id);

  if next_hash = coalesce(recipe.macros_hash, '') then
    return coalesce(new, old);
  end if;

  if next_hash = '' then
    delete from public.recipe_macro_jobs where recipe_id = target_id;

    update public.recipes
    set calories = 0,
        protein = 0,
        fat = 0,
        carbs = 0,
        macros_status = 'idle',
        macros_hash = '',
        macros_error = null,
        macros_updated_at = now()
    where id = target_id;

    return coalesce(new, old);
  end if;

  insert into public.recipe_macro_jobs (recipe_id, hash)
  values (target_id, next_hash)
  on conflict (recipe_id) do update
  set hash = excluded.hash,
      attempts = 0,
      run_after = now(),
      last_error = null,
      updated_at = now();

  update public.recipes
  set macros_status = 'pending',
      macros_error = null
  where id = target_id
    and macros_status is distinct from 'pending';

  return coalesce(new, old);
end;
$$;

create trigger queue_macro_estimate
  after insert or update or delete on public.recipe_ingredients
  for each row execute function public.queue_macro_estimate();

grant select on public.recipe_macro_jobs to service_role;
