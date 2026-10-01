import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { ChatClient } from "@/components/chat-client";
import { requireAttendee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toCards } from "@/lib/types";

export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { user } = await requireAttendee();
  const { matchId } = await params;

  const supabase = await createClient();

  // RLS only returns a match the viewer belongs to, so this is the membership check.
  const { data: match } = await supabase
    .from("matches")
    .select("id, active")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) redirect("/home");

  // Empty once either side has blocked the other.
  const { data: partnerRows } = await supabase.rpc("match_partner", { p_match_id: matchId });
  const partner = toCards(partnerRows)[0];
  if (!partner) redirect("/home");

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })
    .limit(500);

  return (
    <ChatClient
      matchId={matchId}
      viewerId={user.id}
      partner={partner}
      active={match.active}
      initialMessages={messages ?? []}
    />
  );
}
