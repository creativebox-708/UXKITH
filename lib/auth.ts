import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type Viewer = { user: User; profile: Profile };

export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return { user, profile };
}

/**
 * Gate for every signed-in page: you must be signed in, you must have answered
 * the invite question, and the answer must have been yes.
 */
export async function requireAttendee(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!viewer.profile.onboarded_at || !viewer.profile.has_invite) redirect("/welcome");
  return viewer;
}
