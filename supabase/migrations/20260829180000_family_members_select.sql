alter policy family_members_select on public.family_members
  using (family_id = public.my_family_id() or user_id = (select auth.uid()));
