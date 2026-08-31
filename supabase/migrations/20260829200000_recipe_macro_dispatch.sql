create extension if not exists pg_net;
create extension if not exists pg_cron;

create table public.food_lookup_cache (
  query_key text primary key,
  description text not null,
  calories numeric not null,
  protein numeric not null,
  fat numeric not null,
  carbs numeric not null,
  density numeric not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.food_lookup_cache enable row level security;

create or replace function public.dispatch_macro_jobs()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  functions_url text;
  service_key text;
begin
  if not exists (
    select 1 from public.recipe_macro_jobs where run_after <= now()
  ) then
    return;
  end if;

  select decrypted_secret into functions_url
  from vault.decrypted_secrets where name = 'edge_functions_url';

  select decrypted_secret into service_key
  from vault.decrypted_secrets where name = 'service_role_key';

  if functions_url is null or service_key is null then
    return;
  end if;

  perform net.http_post(
    url := functions_url || '/estimate-macros',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

select cron.schedule('estimate-macros', '* * * * *', $$select public.dispatch_macro_jobs()$$);
