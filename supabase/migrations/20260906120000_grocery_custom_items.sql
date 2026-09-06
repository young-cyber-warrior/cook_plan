alter table public.grocery_items alter column list_id drop not null;

alter table public.grocery_items drop constraint grocery_items_unit_check;
alter table public.grocery_items add constraint grocery_items_unit_check
  check (unit in ('g', 'ml', 'pcs'));

drop policy grocery_items_select on public.grocery_items;
drop policy grocery_items_insert on public.grocery_items;
drop policy grocery_items_update on public.grocery_items;

create policy grocery_items_select on public.grocery_items for select to authenticated
  using (
    case
      when list_id is null then public.can_read_owner(owner_id)
      else exists (select 1 from public.grocery_lists g where g.id = list_id)
    end
  );

create policy grocery_items_insert on public.grocery_items for insert to authenticated
  with check (
    public.can_write_owner(grocery_items.owner_id)
    and (
      list_id is null
      or exists (
        select 1 from public.grocery_lists g
        where g.id = list_id
          and (public.can_write_owner(g.owner_id) or public.is_shared_with_me('grocery_list', g.id, true))
      )
    )
  );

create policy grocery_items_update on public.grocery_items for update to authenticated
  using (
    case
      when list_id is null then public.can_write_owner(owner_id)
      else exists (
        select 1 from public.grocery_lists g
        where g.id = list_id
          and (public.can_write_owner(g.owner_id) or public.is_shared_with_me('grocery_list', g.id, true))
      )
    end
  )
  with check (
    public.can_write_owner(grocery_items.owner_id)
    and (
      list_id is null
      or exists (
        select 1 from public.grocery_lists g
        where g.id = list_id
          and (public.can_write_owner(g.owner_id) or public.is_shared_with_me('grocery_list', g.id, true))
      )
    )
  );
