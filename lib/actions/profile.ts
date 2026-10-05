"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

export type WelcomeState = { error?: string; savedAt?: number };

/** Without this there is nothing to "Connect on LinkedIn" with, so it is required. */
const NEED_LINKEDIN =
  "Add your LinkedIn profile URL — it is how people connect with you after you match.";

function clean(value: FormDataEntryValue | null, max: number) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  return text.slice(0, max);
}

function cleanLinkedIn(value: FormDataEntryValue | null) {
  const raw = clean(value, 200);
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** The invite gate. Answering either way is what marks onboarding as done. */
export async function completeWelcome(
  _prev: WelcomeState,
  formData: FormData,
): Promise<WelcomeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const answer = formData.get("has_invite");
  if (answer !== "yes" && answer !== "no") {
    return { error: "Pick one so we know whether to list you." };
  }
  const hasInvite = answer === "yes";

  const linkedIn = cleanLinkedIn(formData.get("linkedin_url"));
  if (hasInvite && !linkedIn) return { error: NEED_LINKEDIN };

  const { error } = await supabase
    .from("profiles")
    .update({
      has_invite: hasInvite,
      onboarded_at: new Date().toISOString(),
      headline: clean(formData.get("headline"), 120),
      company: clean(formData.get("company"), 80),
      city: clean(formData.get("city"), 60),
      linkedin_url: linkedIn,
      hoping_to_get: clean(formData.get("hoping_to_get"), 120),
    })
    .eq("id", user.id);

  if (error) return { error: "Could not save that. Try again." };

  revalidatePath("/home");
  if (hasInvite) redirect("/home");
  redirect("/welcome?listed=no");
}

/** Lets someone fix their headline / company / city later, from /settings. */
export async function updateProfile(
  _prev: WelcomeState,
  formData: FormData,
): Promise<WelcomeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const linkedIn = cleanLinkedIn(formData.get("linkedin_url"));
  const { data: me } = await supabase
    .from("profiles")
    .select("has_invite")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.has_invite && !linkedIn) return { error: NEED_LINKEDIN };

  const { error } = await supabase
    .from("profiles")
    .update({
      headline: clean(formData.get("headline"), 120),
      company: clean(formData.get("company"), 80),
      city: clean(formData.get("city"), 60),
      linkedin_url: linkedIn,
      hoping_to_get: clean(formData.get("hoping_to_get"), 120),
    })
    .eq("id", user.id);

  if (error) return { error: "Could not save that. Try again." };

  revalidatePath("/settings");
  revalidatePath("/home");
  return { savedAt: Date.now() };
}

/** Event day only: flips the "here" dot on and tells the mutual matches. */
export async function setHere(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("profiles")
    .update({ is_here: true, here_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false };

  await notify("notify-here", {});
  revalidatePath("/home");
  return { ok: true };
}
