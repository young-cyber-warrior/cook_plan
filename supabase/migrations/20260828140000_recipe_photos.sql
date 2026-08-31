create table public.recipe_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  recipe_id uuid not null references public.recipes (id),
  storage_path text not null,
  content_hash text not null,
  width integer not null default 0,
  height integer not null default 0,
  bytes integer not null default 0,
  position integer not null default 0,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_times jsonb not null default '{}'::jsonb
);

create index recipe_photos_recipe_id_idx on public.recipe_photos (recipe_id);
create index recipe_photos_content_hash_idx on public.recipe_photos (content_hash);

create trigger lww_touch before update on public.recipe_photos
  for each row execute function public.lww_touch();

create or replace function public.enforce_recipe_photo_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.deleted then
    return new;
  end if;

  if (
    select count(*) from public.recipe_photos p
    where p.recipe_id = new.recipe_id
      and not p.deleted
      and p.id <> new.id
  ) >= 3 then
    raise exception 'recipe photo limit reached' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger recipe_photo_limit before insert or update on public.recipe_photos
  for each row execute function public.enforce_recipe_photo_limit();

alter table public.recipe_photos enable row level security;

create policy recipe_photos_select on public.recipe_photos for select to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));
create policy recipe_photos_insert on public.recipe_photos for insert to authenticated
  with check (
    public.can_write_owner(recipe_photos.owner_id)
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (public.can_write_owner(r.owner_id) or public.is_shared_with_me('recipe', r.id, true))
    )
  );
create policy recipe_photos_update on public.recipe_photos for update to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id
      and (public.can_write_owner(r.owner_id) or public.is_shared_with_me('recipe', r.id, true))
  ))
  with check (
    public.can_write_owner(recipe_photos.owner_id)
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (public.can_write_owner(r.owner_id) or public.is_shared_with_me('recipe', r.id, true))
    )
  );

create or replace function public.photo_refcount(p_hash text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.recipe_photos p
  where p.content_hash = p_hash
    and not p.deleted;
$$;

revoke execute on function public.photo_refcount(text) from public;
grant execute on function public.photo_refcount(text) to authenticated;

alter table public.recipes drop column photos;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

create policy recipe_photos_object_select on storage.objects for select to authenticated
  using (
    bucket_id = 'recipe-photos'
    and exists (
      select 1 from public.recipe_photos p
      where p.storage_path = storage.objects.name
        and not p.deleted
        and public.can_read_owner(p.owner_id)
    )
  );

create policy recipe_photos_object_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = 'recipes'
  );

create policy recipe_photos_object_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'recipe-photos'
    and exists (
      select 1 from public.recipe_photos p
      where p.storage_path = storage.objects.name
        and p.owner_id = (select auth.uid())
    )
  );

grant select, insert, update on public.recipe_photos to authenticated;
