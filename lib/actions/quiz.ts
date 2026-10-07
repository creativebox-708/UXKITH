"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { paperFor, QUIZ_LENGTH } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/server";

const CLOCK = "uxkith_quiz_started";
/** Longer than anyone needs, short enough that a stale cookie cannot be banked. */
const MAX_MS = 20 * 60 * 1000;

export type StartState = { ok: boolean; error?: string };
export type SubmitState =
  | { ok: true; correct: number; timeMs: number; wrong: number[] }
  | { ok: false; error: string };

/**
 * Stamps the start time server-side. httpOnly, so the clock is not something
 * the page can edit on its way to the leaderboard.
 */
export async function startQuiz(): Promise<StartState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const { data: existing } = await supabase
    .from("quiz_scores")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { ok: false, error: "You have already had your go." };

  const store = await cookies();
  store.set(CLOCK, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_MS / 1000,
  });

  return { ok: true };
}

export async function submitQuiz(picked: number[]): Promise<SubmitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  if (!Array.isArray(picked) || picked.length !== QUIZ_LENGTH) {
    return { ok: false, error: "That answer sheet did not look right. Start again." };
  }

  const store = await cookies();
  const startedAt = Number(store.get(CLOCK)?.value);
  if (!Number.isFinite(startedAt)) {
    return { ok: false, error: "The clock was lost. Start the quiz again." };
  }

  const timeMs = Date.now() - startedAt;
  if (timeMs < 0 || timeMs > MAX_MS) {
    return { ok: false, error: "That took too long to count. Start again." };
  }

  // Graded here, against a paper the browser never saw the answers to.
  const { answers } = paperFor(user.id);
  const wrong: number[] = [];
  let correct = 0;
  answers.forEach((answer, i) => {
    if (picked[i] === answer) correct += 1;
    else wrong.push(i);
  });

  // One attempt: the primary key refuses a second row, and there is no update
  // policy, so a replay cannot overwrite a worse score with a better one.
  const { error } = await supabase
    .from("quiz_scores")
    .insert({ user_id: user.id, correct, time_ms: Math.round(timeMs) });

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "You have already had your go."
          : "Could not save that score. Try once more.",
    };
  }

  store.delete(CLOCK);
  revalidatePath("/quiz");
  return { ok: true, correct, timeMs: Math.round(timeMs), wrong };
}
