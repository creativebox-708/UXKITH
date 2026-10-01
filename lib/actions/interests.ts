"use server";

import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

export type ToggleResult =
  | { ok: true; interestCount: number; matchId: string | null; matchActive: boolean }
  | { ok: false; error: string };

/**
 * One tap in, one tap out. The insert notifies the other person; the undo is
 * deliberately silent.
 */
export async function toggleInterest(targetId: string, interested: boolean): Promise<ToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again to do that." };
  if (user.id === targetId) return { ok: false, error: "That one is you." };

  if (interested) {
    const { error } = await supabase
      .from("interests")
      .insert({ from_user: user.id, to_user: targetId });

    // 23505 = the row is already there, which is the state we wanted anyway.
    if (error && error.code !== "23505") {
      return { ok: false, error: "Could not save that. Try again." };
    }
    if (!error) await notify("notify-interest", { toUser: targetId });
  } else {
    const { error } = await supabase
      .from("interests")
      .delete()
      .eq("from_user", user.id)
      .eq("to_user", targetId);

    if (error) return { ok: false, error: "Could not undo that. Try again." };
  }

  const [counts, match] = await Promise.all([
    supabase.rpc("interest_counts", { user_ids: [targetId] }),
    supabase
      .from("matches")
      .select("id, active")
      .or(
        `and(user_a.eq.${user.id},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${user.id})`,
      )
      .maybeSingle(),
  ]);

  return {
    ok: true,
    interestCount: counts.data?.[0]?.interest_count ?? 0,
    matchId: match.data?.id ?? null,
    matchActive: match.data?.active ?? false,
  };
}

/** Removes someone from the "people who want to meet me" tab, for me only. */
export async function dismissInbound(userId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("dismissals")
    .upsert({ user_id: user.id, dismissed_user: userId }, { onConflict: "user_id,dismissed_user" });

  return { ok: !error };
}
