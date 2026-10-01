import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Fire-and-forget call into a Supabase Edge Function, carrying the caller's own
 * JWT so the function can prove who is asking. Email must never be able to fail
 * a tap, so every error is swallowed after logging.
 */
export async function notify(fn: "notify-interest" | "notify-here", body: Record<string, unknown>) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.functions.invoke(fn, {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  } catch (error) {
    console.error(`[notify:${fn}]`, error);
  }
}
