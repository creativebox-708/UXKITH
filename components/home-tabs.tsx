"use client";

import Link from "next/link";
import { useState } from "react";

import { CardGrid } from "@/components/card-grid";
import { EmptyState } from "@/components/empty-state";
import { useCardStates, type CardState } from "@/lib/card-store";
import type { ProfileCard as Card } from "@/lib/types";

type Filter = "all" | "pending" | "accepted";

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["pending", "Pending"],
  ["accepted", "Accepted"],
];

const isAccepted = (state: CardState) => Boolean(state.matchId && state.matchActive);

function Group({ label, cards }: { label: string | null; cards: Card[] }) {
  if (cards.length === 0) return null;
  return (
    <section>
      {label && (
        <h2 className="mb-2.5 text-[9.5px] font-semibold tracking-[0.14em] text-muted-dim uppercase">
          {label}
        </h2>
      )}
      <CardGrid cards={cards} />
    </section>
  );
}

/**
 * The dashboard. "All" is everything that concerns you, newest obligation
 * first; the other two are the same people narrowed by where the invite got
 * to. Every count reads the optimistic store, so accepting an invite moves a
 * card between filters on the tap.
 */
export function HomeTabs({
  suggested,
  outgoing,
  inbound,
}: {
  suggested: Card[];
  outgoing: Card[];
  inbound: Card[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const outgoingStates = useCardStates(outgoing);
  const inboundStates = useCardStates(inbound);

  // One person can appear in both directions, so connections are deduped.
  const connected = new Map<string, Card>();
  outgoing.forEach((card, i) => {
    if (isAccepted(outgoingStates[i])) connected.set(card.id, card);
  });
  inbound.forEach((card, i) => {
    if (isAccepted(inboundStates[i])) connected.set(card.id, card);
  });

  const waiting = inbound.filter((_, i) => !isAccepted(inboundStates[i]));
  const sent = outgoing.filter((_, i) => !isAccepted(outgoingStates[i]));
  const accepted = [...connected.values()];

  // Suggestions already exclude anyone you tagged; this also drops anyone who
  // tagged you, so nobody shows up twice in "All".
  const seen = new Set([...waiting, ...sent, ...accepted].map((card) => card.id));
  const fresh = suggested.filter((card) => !seen.has(card.id));

  const counts: Record<Filter, number> = {
    all: waiting.length + sent.length + accepted.length + fresh.length,
    pending: waiting.length + sent.length,
    accepted: accepted.length,
  };

  const groups: { label: string | null; cards: Card[] }[] =
    filter === "accepted"
      ? [{ label: null, cards: accepted }]
      : filter === "pending"
        ? [
            { label: "Waiting on you", cards: waiting },
            { label: "Invites you sent", cards: sent },
          ]
        : [
            { label: "Waiting on you", cards: waiting },
            { label: "Connected", cards: accepted },
            { label: "Invites you sent", cards: sent },
            { label: "Suggested for you", cards: fresh },
          ];

  const total = groups.reduce((sum, group) => sum + group.cards.length, 0);

  return (
    <div>
      <div className="flex gap-1.5">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              filter === key
                ? "border-line bg-surface-hi text-paper"
                : "border-line-soft text-muted hover:border-line hover:text-paper"
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span
                className={`rounded-full px-1.5 text-[10.5px] tabular-nums ${
                  key === "accepted" ? "bg-mutual/18 text-mutual" : "bg-accent/18 text-accent-hi"
                }`}
              >
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-6">
        {total === 0 ? (
          filter === "accepted" ? (
            <EmptyState
              emoji="&#129309;"
              title="No connections yet"
              body="A connection happens when you both say yes. Send an invite and wait for them to tap back."
            />
          ) : filter === "pending" ? (
            <EmptyState
              emoji="&#128075;"
              title="Nothing pending"
              body="No invites waiting either way. Tap 'Interested to meet' on anyone you'd like to find on the day."
            />
          ) : (
            <EmptyState
              emoji="&#127793;"
              title="You&rsquo;re early"
              body="Not enough people have joined yet. Check back in a bit — invitees are still signing in."
              action={
                <Link
                  href="/browse"
                  className="flex h-10 items-center rounded-xl border border-line px-4 text-[13px] font-medium text-paper transition-colors hover:bg-surface"
                >
                  Browse all designers
                </Link>
              }
            />
          )
        ) : (
          groups.map((group) => (
            <Group
              key={group.label ?? "cards"}
              // A single group needs no heading; it would just repeat the chip.
              label={groups.filter((g) => g.cards.length > 0).length > 1 ? group.label : null}
              cards={group.cards}
            />
          ))
        )}
      </div>
    </div>
  );
}
