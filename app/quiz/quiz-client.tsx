"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";

import { Avatar } from "@/components/avatar";
import { SpinnerMark } from "@/components/icons";
import { useToast } from "@/components/toast";
import { startQuiz, submitQuiz } from "@/lib/actions/quiz";
import type { PublicQuestion } from "@/lib/quiz";
import type { QuizEntry } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

function clock(ms: number) {
  const total = Math.round(ms / 100) / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  const mins = Math.floor(total / 60);
  return `${mins}m ${Math.round(total - mins * 60)}s`;
}

/** One ticking subscription for the whole screen, rather than a state timer. */
function useElapsed(startedAt: number | null) {
  const now = useSyncExternalStore(
    useCallback((notify: () => void) => {
      const id = window.setInterval(notify, 100);
      return () => window.clearInterval(id);
    }, []),
    () => Math.floor(Date.now() / 100),
    () => 0,
  );
  return startedAt === null ? 0 : now * 100 - startedAt;
}

function Board({ entries, playerCount }: { entries: QuizEntry[]; playerCount: number }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-line-soft bg-surface/40 px-5 py-8 text-center">
        <p className="text-2xl" aria-hidden>
          🏁
        </p>
        <p className="mt-2 text-[14px] font-semibold text-paper">Nobody has played yet</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          First score sets the bar. No pressure.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line-soft bg-surface/40">
      <div className="flex items-baseline justify-between border-b border-line-soft px-4 py-2.5">
        <p className="text-[9.5px] font-semibold tracking-[0.14em] text-muted-dim uppercase">
          Leaderboard
        </p>
        <p className="text-[11px] text-muted-dim">
          {playerCount} {playerCount === 1 ? "player" : "players"}
        </p>
      </div>
      <ul className="divide-y divide-line-soft">
        {entries.map((entry) => (
          <li
            key={entry.userId}
            className={`flex items-center gap-3 px-4 py-2.5 ${
              entry.isMe ? "bg-accent/10" : ""
            }`}
          >
            <span className="w-7 shrink-0 text-center text-[13px] font-semibold tabular-nums text-muted">
              {entry.rank <= 3 ? (
                <span aria-label={`Rank ${entry.rank}`}>{MEDALS[entry.rank - 1]}</span>
              ) : (
                entry.rank
              )}
            </span>
            <Avatar name={entry.fullName} src={entry.avatarUrl} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-paper">
                {entry.fullName}
                {entry.isMe && <span className="ml-1.5 text-[11px] text-accent-hi">you</span>}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[13px] font-semibold tabular-nums text-paper">
                {entry.correct}
              </span>
              <span className="block text-[10.5px] tabular-nums text-muted-dim">
                {clock(entry.timeMs)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Done = { correct: number; timeMs: number; wrong: number[] };

export function QuizClient({
  questions,
  nuggets,
  total,
  myScore,
  leaderboard,
  playerCount,
}: {
  questions: PublicQuestion[];
  nuggets: string[];
  total: number;
  myScore: QuizEntry | null;
  leaderboard: QuizEntry[];
  playerCount: number;
}) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const elapsed = useElapsed(done ? null : startedAt);

  // Nothing is lost if you wander off mid-quiz, but it is worth saying so.
  useEffect(() => {
    if (startedAt === null || done) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [startedAt, done]);

  function begin() {
    startTransition(async () => {
      const result = await startQuiz();
      if (!result.ok) {
        toast(result.error ?? "Could not start the quiz.", "bad");
        return;
      }
      setStartedAt(Date.now());
      setIndex(0);
      setPicked([]);
      setChosen(null);
    });
  }

  function answer(option: number) {
    if (chosen !== null || pending) return;
    setChosen(option);
    const next = [...picked, option];

    // A beat of feedback before moving on, so a tap feels like it landed.
    window.setTimeout(() => {
      if (next.length === questions.length) {
        startTransition(async () => {
          const result = await submitQuiz(next);
          if (!result.ok) {
            toast(result.error, "bad");
            setStartedAt(null);
            setPicked([]);
            setChosen(null);
            return;
          }
          setDone({ correct: result.correct, timeMs: result.timeMs, wrong: result.wrong });
        });
        return;
      }
      setPicked(next);
      setIndex(next.length);
      setChosen(null);
    }, 220);
  }

  // Already played, in a previous visit.
  if (myScore && !done) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-line-soft bg-surface/50 p-5 text-center">
          <p className="text-3xl" aria-hidden>
            {MEDALS[myScore.rank - 1] ?? "🎯"}
          </p>
          <p className="mt-2 text-[15px] font-semibold text-paper">
            {myScore.correct} out of {total} &middot; {clock(myScore.timeMs)}
          </p>
          <p className="mt-1 text-[12.5px] text-muted">
            Ranked {myScore.rank} of {playerCount}. One attempt each, so that is that.
          </p>
        </div>
        <Board entries={leaderboard} playerCount={playerCount} />
      </div>
    );
  }

  // Just finished.
  if (done) {
    const { emoji, line } = verdictOf(done.correct, total);
    return (
      <div className="flex flex-col gap-5">
        <div className="animate-rise rounded-2xl border border-line-soft bg-surface/50 p-5 text-center">
          <p className="animate-pop text-4xl" aria-hidden>
            {emoji}
          </p>
          <p className="mt-2 font-display text-2xl text-paper">
            {done.correct} / {total}
          </p>
          <p className="mt-0.5 text-[12.5px] tabular-nums text-muted-dim">
            in {clock(done.timeMs)}
          </p>
          <p className="mt-2 text-[13px] text-muted">{line}</p>
          <p className="mt-3 border-t border-line-soft pt-3 text-[11.5px] text-muted-dim">
            Refresh to see where you landed on the board.
          </p>
        </div>

        {done.wrong.length > 0 && (
          <div className="rounded-2xl border border-line-soft bg-surface/40 p-4">
            <p className="text-[9.5px] font-semibold tracking-[0.14em] text-muted-dim uppercase">
              The ones that got away
            </p>
            <ul className="mt-2.5 flex flex-col gap-2">
              {done.wrong.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12px] leading-snug text-muted">
                  <span aria-hidden className="w-[18px] shrink-0">
                    {questions[i].emoji}
                  </span>
                  <span>
                    <span className="block font-medium text-paper">{questions[i].q}</span>
                    <span className="mt-0.5 block text-muted-dim">{nuggets[i]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Board entries={leaderboard} playerCount={playerCount} />
      </div>
    );
  }

  // Not started.
  if (startedAt === null) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-line-soft bg-surface/50 p-5 text-center">
          <p className="text-3xl" aria-hidden>
            🎛️
          </p>
          <h2 className="mt-2 font-display text-xl text-paper">{total} questions about Figma</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-balance text-muted">
            Your own set, drawn just for you. The clock starts when you tap, and ties are broken
            by whoever was quicker. <span className="text-paper">One attempt each</span> — choose
            your moment.
          </p>
          <button
            type="button"
            onClick={begin}
            disabled={pending}
            className="mx-auto mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-[14px] font-semibold text-accent-ink transition-all duration-200 enabled:hover:bg-accent-hi enabled:active:scale-[0.98] disabled:opacity-70"
          >
            {pending && <SpinnerMark className="size-4" />}
            {pending ? "Shuffling…" : "Start the quiz"}
          </button>
          <p className="mt-3 text-[11px] text-muted-dim">
            Just for fun. Your score never touches your profile card.
          </p>
        </div>
        <Board entries={leaderboard} playerCount={playerCount} />
      </div>
    );
  }

  // Playing.
  const question = questions[index];
  const progress = ((index + (chosen === null ? 0 : 1)) / questions.length) * 100;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-baseline justify-between text-[11.5px] text-muted-dim">
          <span className="tabular-nums">
            Question {index + 1} of {questions.length}
          </span>
          <span className="tabular-nums">⏱ {clock(elapsed)}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-surface-hi">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={index} className="animate-rise rounded-2xl border border-line-soft bg-surface/50 p-5">
        <p className="text-2xl" aria-hidden>
          {question.emoji}
        </p>
        <h2 className="mt-2 text-[16px] leading-snug font-semibold text-balance text-paper">
          {question.q}
        </h2>

        <div className="mt-4 flex flex-col gap-2">
          {question.options.map((option, i) => (
            <button
              key={option}
              type="button"
              onClick={() => answer(i)}
              disabled={chosen !== null || pending}
              className={`flex min-h-11 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] transition-all duration-150 ${
                chosen === i
                  ? "border-accent bg-accent/15 text-paper"
                  : "border-line-soft bg-surface/60 text-muted enabled:hover:border-line enabled:hover:text-paper"
              } ${chosen !== null && chosen !== i ? "opacity-45" : ""}`}
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-full border border-line text-[10px] font-semibold text-muted-dim">
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <p className="flex items-center justify-center gap-2 text-[12px] text-muted-dim">
          <SpinnerMark className="size-3.5" />
          Marking your paper…
        </p>
      )}
    </div>
  );
}

/** Mirrors the server's wording without importing the answer key. */
function verdictOf(correct: number, total: number) {
  if (correct === total) return { emoji: "🏆", line: "Flawless. Go and gloat." };
  if (correct >= total - 1) return { emoji: "🔥", line: "Nearly perfect. Show-off." };
  if (correct >= total - 3) return { emoji: "✨", line: "Solid. You know your way around." };
  if (correct >= total / 2)
    return { emoji: "🙂", line: "Respectable. Shift + A will haunt you." };
  if (correct > 0) return { emoji: "🌱", line: "Room to grow — and a conference to grow at." };
  return { emoji: "🫠", line: "Bold strategy. Let's never speak of it." };
}
