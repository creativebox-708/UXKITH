"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { CheckMark, ChatMark } from "@/components/icons";
import { useToast } from "@/components/toast";
import { toggleInterest } from "@/lib/actions/interests";
import { fromCard, setCardState, useCardState } from "@/lib/card-store";
import type { ProfileCard } from "@/lib/types";

export function InterestButton({ card, size = "sm" }: { card: ProfileCard; size?: "sm" | "md" }) {
  const state = useCardState(card);
  const [pending, startTransition] = useTransition();
  const [popping, setPopping] = useState(false);
  const toast = useToast();

  const mutual = Boolean(state.matchId && state.matchActive);
  const height = size === "md" ? "h-10 text-[13px]" : "h-8 text-[11.5px]";

  if (mutual) {
    return (
      <Link
        href={`/chat/${state.matchId}`}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl border border-mutual/40 bg-mutual/15 font-semibold text-mutual transition-colors hover:bg-mutual/25 ${height}`}
      >
        <ChatMark className="size-[13px]" />
        Chat
      </Link>
    );
  }

  function onTap() {
    if (pending) return;

    const current = state;
    const next = {
      interested: !current.interested,
      count: Math.max(0, current.count + (current.interested ? -1 : 1)),
      matchId: current.matchId,
      matchActive: current.interested ? false : current.matchActive,
    };

    // Optimistic: the tap lands now, the server catches up.
    setCardState(card.id, next);
    setPopping(true);
    window.setTimeout(() => setPopping(false), 420);
    if (next.interested) toast("They'll be notified.", "good");

    startTransition(async () => {
      const result = await toggleInterest(card.id, next.interested);
      if (!result.ok) {
        setCardState(card.id, current);
        toast(result.error, "bad");
        return;
      }
      setCardState(card.id, {
        interested: next.interested,
        count: result.interestCount,
        matchId: result.matchId,
        matchActive: result.matchActive,
      });
    });
  }

  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={state.interested}
      className={`flex w-full items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-200 active:scale-[0.97] ${height} ${
        state.interested
          ? "border border-accent/45 bg-accent/12 text-accent-hi"
          : "bg-accent text-accent-ink hover:bg-accent-hi"
      } ${popping ? "animate-pop" : ""} ${pending ? "opacity-85" : ""}`}
    >
      {state.interested && <CheckMark className="size-[13px]" />}
      {state.interested ? "Interested" : "Interested to meet"}
    </button>
  );
}

/** The public inbound counter, kept in step with the optimistic toggle. */
export function InterestCount({ card }: { card: ProfileCard }) {
  const state = useCardState(card);
  const base = fromCard(card);
  const bumped = state.count !== base.count;

  return (
    <span
      className={`text-[11px] tabular-nums transition-colors ${bumped ? "text-accent-hi" : "text-muted-dim"}`}
    >
      {state.count === 0
        ? "First to say hello?"
        : `${state.count} interested`}
    </span>
  );
}

/** The whole celebration: a quiet pill, and the button becoming "Chat". */
export function MutualBadge({ card }: { card: ProfileCard }) {
  const state = useCardState(card);
  if (!state.matchId || !state.matchActive) return null;

  return (
    <span className="animate-pop inline-flex items-center rounded-full border border-mutual/35 bg-mutual/12 px-1.5 py-0.5 text-[9.5px] font-semibold tracking-[0.06em] text-mutual uppercase">
      Mutual
    </span>
  );
}
