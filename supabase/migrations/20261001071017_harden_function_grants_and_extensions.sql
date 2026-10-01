-- 1. pin the search_path on the one function that was missing it
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 2. move pg_trgm out of the public schema
create schema if not exists extensions;
drop index if exists public.profiles_full_name_trgm_idx;
drop extension if exists pg_trgm;
create extension pg_trgm with schema extensions;
create index profiles_full_name_trgm_idx
  on public.profiles using gin (full_name extensions.gin_trgm_ops);

-- 3. nothing in public is callable over the REST API unless it is granted below.
--    This closes the default PUBLIC execute grant that exposed every function
--    (trigger functions included) to the anon role via /rest/v1/rpc/*.
revoke execute on all functions in schema public from public, anon, authenticated;

-- used inside RLS policies, so the signed-in caller needs EXECUTE
grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;
grant execute on function public.can_read_match(uuid)        to authenticated;
grant execute on function public.can_write_match(uuid)       to authenticated;

-- the app's own API surface
grant execute on function public.attendee_count()                                   to authenticated;
grant execute on function public.interest_counts(uuid[])                            to authenticated;
grant execute on function public.suggested_profiles(int)                            to authenticated;
grant execute on function public.browse_profiles(text, text, text, text, int, int)  to authenticated;
grant execute on function public.my_outgoing()                                      to authenticated;
grant execute on function public.my_inbound()                                       to authenticated;
grant execute on function public.inbound_count()                                    to authenticated;
grant execute on function public.match_partner(uuid)                                to authenticated;
grant execute on function public.filter_options()                                   to authenticated;
grant execute on function public.delete_my_account()                                to authenticated;

-- cards_for is an internal helper: only the definer functions above call it
-- handle_new_user / on_interest_* / on_block_insert / touch_updated_at are
-- trigger functions and are deliberately left ungranted.
