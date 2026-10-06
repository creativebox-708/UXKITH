-- Counters were counting the same person more than once.
--
-- Once an invite is accepted the two of you are connected, and that shows in
-- "connections". But inbound_count() kept counting the sender, so the home
-- banner still said "1 person wants to meet you" after you had already said
-- yes, and the raw interests count kept counting the recipient, so one person
-- appeared in all three stats at once.
--
-- Both counters now mean "still pending": nothing is waiting on you once you
-- have tapped back, and nothing is waiting on them once they have.

create or replace function public.inbound_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.interests i
  join public.profiles p on p.id = i.from_user and p.has_invite
  where i.to_user = auth.uid()
    and not public.is_blocked_pair(auth.uid(), i.from_user)
    and not exists (
      select 1 from public.dismissals d
      where d.user_id = auth.uid() and d.dismissed_user = i.from_user
    )
    -- you have already accepted: this one is a connection, not an invite
    and not exists (
      select 1 from public.interests mine
      where mine.from_user = auth.uid() and mine.to_user = i.from_user
    );
$$;

-- The mirror image: invites you have sent that nobody has answered yet.
-- Needed as an RPC because the reverse interest cannot be checked from the
-- client without exposing who else has tapped whom.
create or replace function public.outgoing_pending_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.interests i
  join public.profiles p on p.id = i.to_user and p.has_invite
  where i.from_user = auth.uid()
    and not public.is_blocked_pair(auth.uid(), i.to_user)
    and not exists (
      select 1 from public.interests theirs
      where theirs.from_user = i.to_user and theirs.to_user = auth.uid()
    );
$$;

-- A newly created function picks up the default PUBLIC execute grant again,
-- so it has to be revoked here the way the hardening migration did.
revoke execute on function public.outgoing_pending_count() from public, anon;
grant execute on function public.outgoing_pending_count() to authenticated;
