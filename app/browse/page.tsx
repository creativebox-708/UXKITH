import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { BrowseClient } from "@/components/browse-client";
import { requireAttendee } from "@/lib/auth";
import { eventDayEnabled } from "@/lib/flags";
import { createClient } from "@/lib/supabase/server";
import { toCards } from "@/lib/types";

export const metadata: Metadata = { title: "Browse" };
export const dynamic = "force-dynamic";

type FilterOptions = { cities?: string[]; companies?: string[] };

export default async function BrowsePage() {
  const { user, profile } = await requireAttendee();
  const supabase = await createClient();

  const [attendees, inbound, myList, firstPage, options] = await Promise.all([
    supabase.rpc("attendee_count"),
    supabase.rpc("inbound_count"),
    supabase.from("interests").select("*", { count: "exact", head: true }).eq("from_user", user.id),
    supabase.rpc("browse_profiles", { p_limit: 24, p_offset: 0 }),
    supabase.rpc("filter_options"),
  ]);

  const filters = (options.data ?? {}) as FilterOptions;

  return (
    <AppShell
      viewerId={user.id}
      counts={{
        attendees: attendees.data ?? 0,
        inbound: inbound.data ?? 0,
        myList: myList.count ?? 0,
      }}
      eventDay={eventDayEnabled}
      isHere={profile.is_here}
    >
      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(var(--footer-h)+2.5rem)]">
        <BrowseClient
          initialCards={toCards(firstPage.data)}
          cities={filters.cities ?? []}
          companies={filters.companies ?? []}
        />
      </main>
    </AppShell>
  );
}
