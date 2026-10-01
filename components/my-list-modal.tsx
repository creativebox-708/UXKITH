"use client";

import { Suspense, use, useEffect, useState } from "react";

import { CloseMark, SpinnerMark } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { ProfileCard, ProfileCardSkeleton } from "@/components/profile-card";
import { useToast } from "@/components/toast";
import { dismissInbound } from "@/lib/actions/interests";
import { createClient } from "@/lib/supabase/client";
import { toCards, type ProfileCard as Card } from "@/lib/types";

export type Tab = "outgoing" | "inbound";
export type MyLists = { ok: boolean; outgoing: Card[]; inbound: Card[] };

/**
 * Started by the click that opens the modal, so the fetch is already in flight
 * by the time the dialog paints. Never rejects: the UI renders a retry instead.
 */
export function loadMyLists(): Promise<MyLists> {
  const supabase = createClient();
  return Promise.all([supabase.rpc("my_outgoing"), supabase.rpc("my_inbound")])
    .then(([out, inb]) =>
      out.error || inb.error
        ? { ok: false, outgoing: [], inbound: [] }
        : { ok: true, outgoing: toCards(out.data), inbound: toCards(inb.data) },
    )
    .catch(() => ({ ok: false, outgoing: [], inbound: [] }));
}

function Skeletons() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {Array.from({ length: 4 }, (_, i) => (
        <ProfileCardSkeleton key={i} />
      ))}
    </div>
  );
}

function Lists({
  promise,
  tab,
  onCounts,
  onRetry,
}: {
  promise: Promise<MyLists>;
  tab: Tab;
  onCounts: (counts: { outgoing: number; inbound: number }) => void;
  onRetry: () => void;
}) {
  const lists = use(promise);
  const [inbound, setInbound] = useState(lists.inbound);
  const toast = useToast();

  useEffect(() => {
    onCounts({ outgoing: lists.outgoing.length, inbound: inbound.length });
  }, [onCounts, lists.outgoing.length, inbound.length]);

  async function dismiss(card: Card) {
    setInbound((current) => current.filter((c) => c.id !== card.id));
    const result = await dismissInbound(card.id);
    if (!result.ok) {
      setInbound((current) => [card, ...current]);
      toast("Could not dismiss that. Try again.", "bad");
    }
  }

  if (!lists.ok) {
    return (
      <EmptyState
        title="That didn't load"
        body="The connection dropped on the way. Try once more."
        action={
          <button
            type="button"
            onClick={onRetry}
            className="flex h-9 items-center gap-2 rounded-xl border border-line px-4 text-[13px] font-medium text-paper transition-colors hover:bg-surface"
          >
            <SpinnerMark className="size-3.5" />
            Retry
          </button>
        }
      />
    );
  }

  const cards = tab === "outgoing" ? lists.outgoing : inbound;

  if (cards.length === 0) {
    return tab === "outgoing" ? (
      <EmptyState
        emoji="&#128075;"
        title="Nobody on your list yet"
        body="Tap 'Interested to meet' on anyone you'd like to find on the day. They'll hear about it, and you can undo any time."
      />
    ) : (
      <EmptyState
        emoji="&#9749;"
        title="Nobody has tagged you yet"
        body="It's early. Put a line on your card about what you're hoping to get out of Config — it gives people a reason to reach out."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <ProfileCard
          key={card.id}
          card={card}
          footer={
            tab === "inbound" ? (
              <button
                type="button"
                onClick={() => void dismiss(card)}
                className="h-7 w-full rounded-xl border border-line-soft text-[11px] font-medium text-muted-dim transition-colors hover:border-line hover:text-muted"
              >
                Dismiss
              </button>
            ) : undefined
          }
        />
      ))}
    </div>
  );
}

/** Mounted only while open, so opening it is always a fresh load. */
export function MyListModal({
  promise,
  initialTab = "outgoing",
  onClose,
  onRetry,
}: {
  promise: Promise<MyLists>;
  initialTab?: Tab;
  onClose: () => void;
  onRetry: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [counts, setCounts] = useState<{ outgoing: number; inbound: number } | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-ink/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="My list"
        className="animate-sheet relative flex max-h-[86svh] w-full flex-col overflow-hidden rounded-t-3xl border border-line-soft bg-ink-soft shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.9)] sm:max-h-[80svh] sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 pt-4 pb-3">
          <h2 className="font-display text-xl text-paper">My list</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close my list"
            className="grid size-8 place-items-center rounded-full border border-line-soft text-muted transition-colors hover:border-line hover:text-paper"
          >
            <CloseMark className="size-3.5" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {(
            [
              ["outgoing", "I want to meet"],
              ["inbound", "Want to meet me"],
            ] as const
          ).map(([key, label]) => {
            const count = counts?.[key] ?? 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  tab === key
                    ? "bg-surface-hi text-paper"
                    : "text-muted hover:bg-surface/60 hover:text-paper"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="rounded-full bg-accent/18 px-1.5 text-[10.5px] tabular-nums text-accent-hi">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-5">
          <Suspense fallback={<Skeletons />}>
            <Lists promise={promise} tab={tab} onCounts={setCounts} onRetry={onRetry} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
