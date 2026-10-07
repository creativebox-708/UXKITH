import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { requireAttendee } from "@/lib/auth";
import { eventDayEnabled } from "@/lib/flags";
import { nuggetsFor, paperFor, QUIZ_LENGTH } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/server";
import { toNotifications, toQuizEntries } from "@/lib/types";

import { QuizClient } from "./quiz-client";

export const metadata: Metadata = { title: "Quiz" };
export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const { user, profile } = await requireAttendee();
  const supabase = await createClient();

  const [attendees, inbound, myList, notes, board, mine, players] = await Promise.all([
    supabase.rpc("attendee_count"),
    supabase.rpc("inbound_count"),
    supabase.rpc("outgoing_pending_count"),
    supabase.rpc("notifications", { p_limit: 20 }),
    supabase.rpc("quiz_leaderboard", { p_limit: 50 }),
    supabase.rpc("my_quiz_score"),
    supabase.rpc("quiz_player_count"),
  ]);

  // The answer key stays here. Only the questions and options go down the wire.
  const { questions } = paperFor(user.id);

  return (
    <AppShell
      viewerId={user.id}
      counts={{
        attendees: attendees.data ?? 0,
        inbound: inbound.data ?? 0,
        myList: myList.data ?? 0,
      }}
      notifications={toNotifications(notes.data)}
      eventDay={eventDayEnabled}
      isHere={profile.is_here}
    >
      <main className="mx-auto w-full max-w-lg px-4 pt-6 pb-[calc(var(--footer-h)+2.5rem)]">
        <h1 className="font-display text-[1.6rem] leading-tight text-paper sm:text-3xl">
          The Figma quiz <span aria-hidden>🎲</span>
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          A sideshow, not the point. Nothing here affects who wants to meet whom.
        </p>

        <div className="mt-5">
          <QuizClient
            questions={questions}
            nuggets={nuggetsFor(user.id)}
            total={QUIZ_LENGTH}
            myScore={toQuizEntries(mine.data)[0] ?? null}
            leaderboard={toQuizEntries(board.data)}
            playerCount={players.data ?? 0}
          />
        </div>
      </main>
    </AppShell>
  );
}
