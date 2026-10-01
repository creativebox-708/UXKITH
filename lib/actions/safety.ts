"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/** Hides the two people from each other everywhere and closes the chat. */
export async function blockUser(userId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === userId) return { ok: false };

  const { error } = await supabase
    .from("blocks")
    .upsert({ blocker: user.id, blocked: userId }, { onConflict: "blocker,blocked" });

  if (error) return { ok: false };

  revalidatePath("/home");
  revalidatePath("/browse");
  return { ok: true };
}

/** Writes a row the team reviews by hand. Nothing is automated off the back of it. */
export async function reportUser(input: {
  reported: string;
  matchId?: string | null;
  reason?: string | null;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === input.reported) return { ok: false };

  const { error } = await supabase.from("reports").insert({
    reporter: user.id,
    reported: input.reported,
    match_id: input.matchId ?? null,
    reason: input.reason?.trim().slice(0, 1000) || null,
  });

  return { ok: !error };
}

/** Deletes the auth user; profile, interests, matches and messages cascade. */
export async function deleteAccount(): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "Could not delete the account. Try again." };

  await supabase.auth.signOut();
  redirect("/");
}
