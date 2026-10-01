import Link from "next/link";
import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { CardGrid } from "@/components/card-grid";
import { EmptyState } from "@/components/empty-state";
import { requireAttendee } from "@/lib/auth";
import { eventDayEnabled } from "@/lib/flags";
import { createClient } from "@/lib/supabase/server";
import { toCards } from "@/lib/types";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, profile } = await requireAttendee();
  const supabase = await createClient();

  const [attendees, inbound, myList, suggested] = await Promise.all([
    supabase.rpc("attendee_count"),
    supabase.rpc("inbound_count"),
    supabase.from("interests").select("*", { count: "exact", head: true }).eq("from_user", user.id),
    supabase.rpc("suggested_profiles", { p_limit: 8 }),
  ]);

  const cards = toCards(suggested.data);
  const firstName = profile.full_name.split(/\s+/)[0];

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
      showInboundBanner
    >
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-[calc(var(--footer-h)+2.5rem)]">
        <h1 className="font-display text-[1.6rem] leading-tight text-paper sm:text-3xl">
          Who do you want to meet{firstName ? `, ${firstName}` : ""}?
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          A fresh handful every day. One tap tells them, and nothing more.
        </p>

        <div className="mt-5">
          {suggested.error ? (
            <EmptyState
              title="Couldn't load suggestions"
              body="The connection dropped on the way. Refresh the page and we'll try again."
            />
          ) : cards.length > 0 ? (
            <CardGrid cards={cards} />
          ) : (
            <EmptyState
              emoji="&#127793;"
              title="You're early"
              body="Not enough people have joined yet, or you've already tagged everyone we had to show. Check back in a bit — invitees are still signing in."
              action={
                <Link
                  href="/browse"
                  className="flex h-10 items-center rounded-xl border border-line px-4 text-[13px] font-medium text-paper transition-colors hover:bg-surface"
                >
                  Browse all designers
                </Link>
              }
            />
          )}
        </div>

        {cards.length > 0 && (
          <div className="mt-6 flex justify-center">
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
        )}
      </main>
    </AppShell>
  );
}
