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
 * Gate for every signed-in page. Signing in is the whole of it: the invite
 * question used to decide whether you existed to anybody, which left people
 * who abandoned /welcome stuck outside and invisible. Confirming an invite is
 * now a badge you are asked for from inside the app, not a turnstile.
 */
export async function requireAttendee(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  return viewer;
}
