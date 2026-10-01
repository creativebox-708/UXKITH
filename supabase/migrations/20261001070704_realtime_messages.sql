alter publication supabase_realtime add table public.messages;
alter table public.messages replica identity full;
