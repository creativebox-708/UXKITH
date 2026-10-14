-- Single-use tokens so owner-only edge functions can be triggered from SQL
-- (via pg_net) without handing out the service-role key.
create extension if not exists pg_net with schema extensions;
create schema if not exists private;
revoke all on schema private from anon, authenticated, public;
create table if not exists private.ops_tokens (
  token text primary key,
  purpose text not null,
  created_at timestamptz not null default now()
);
revoke all on private.ops_tokens from anon, authenticated, public;
create or replace function public.consume_ops_token(p_token text, p_purpose text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with d as (
    delete from private.ops_tokens
    where token = p_token and purpose = p_purpose
    returning 1
  )
  select exists (select 1 from d);
$$;
revoke all on function public.consume_ops_token(text, text) from public, anon, authenticated;
grant execute on function public.consume_ops_token(text, text) to service_role;
