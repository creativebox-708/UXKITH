import Link from "next/link";
import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { HomeTabs } from "@/components/home-tabs";
import { MyCard } from "@/components/my-card";
import { requireAttendee } from "@/lib/auth";
import { eventDayEnabled } from "@/lib/flags";
import { createClient } from "@/lib/supabase/server";
import { toCards, toNotifications } from "@/lib/types";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, profile } = await requireAttendee();
  const supabase = await createClient();

  const [attendees, inbound, myList, connections, suggested, outgoing, incoming, notes] =
    await Promise.all([
      supabase.rpc("attendee_count"),
      supabase.rpc("inbound_count"),
      supabase
        .from("interests")
        .select("*", { count: "exact", head: true })
        .eq("from_user", user.id),
      // RLS already narrows matches to the two people in them, so this counts mine.
      supabase.from("matches").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.rpc("suggested_profiles", { p_limit: 8 }),
      // Both directions, so the filters can be switched without a round trip.
      supabase.rpc("my_outgoing"),
      supabase.rpc("my_inbound"),
      supabase.rpc("notifications", { p_limit: 20 }),
    ]);

  const firstName = profile.full_name.split(/\s+/)[0];
  const failed = suggested.error && outgoing.error && incoming.error;

  return (
    <AppShell
      viewerId={user.id}
      counts={{
        attendees: attendees.data ?? 0,
        inbound: inbound.data ?? 0,
        myList: myList.count ?? 0,
      }}
      notifications={toNotifications(notes.data)}
      eventDay={eventDayEnabled}
      isHere={profile.is_here}
      showInboundBanner
    >
      <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-[calc(var(--footer-h)+2.5rem)]">
        <MyCard
          profile={profile}
          stats={{
            inbound: inbound.data ?? 0,
            outgoing: myList.count ?? 0,
            connections: connections.count ?? 0,
          }}
        />

        <h1 className="mt-7 font-display text-[1.6rem] leading-tight text-paper sm:text-3xl">
          Who do you want to meet{firstName ? `, ${firstName}` : ""}?
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          A fresh handful every day. One tap tells them, and nothing more.
        </p>

        <div className="mt-5">
          {failed ? (
            <EmptyState
              title="Couldn't load your people"
              body="The connection dropped on the way. Refresh the page and we'll try again."
            />
          ) : (
            <HomeTabs
              suggested={toCards(suggested.data)}
              outgoing={toCards(outgoing.data)}
              inbound={toCards(incoming.data)}
            />
          )}
        </div>

        <div className="mt-7 flex justify-center">
          <Link
            href="/browse"
            className="flex h-11 items-center gap-2 rounded-xl border border-line-soft bg-surface/50 px-5 text-[13.5px] font-medium text-paper transition-colors hover:border-line hover:bg-surface"
          >
            Browse all designers
            <span aria-hidden className="text-muted-dim">
              &rarr;
            </span>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
