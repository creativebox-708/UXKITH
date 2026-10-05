"use client";

import { Suspense, use, useEffect, useState } from "react";

import { CloseMark, SpinnerMark } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { ProfileCard, ProfileCardSkeleton } from "@/components/profile-card";
import { useToast } from "@/components/toast";
import { dismissInbound } from "@/lib/actions/interests";
import { useCardStates, type CardState } from "@/lib/card-store";
import { createClient } from "@/lib/supabase/client";
import { toCards, type ProfileCard as Card } from "@/lib/types";

export type Tab = "outgoing" | "inbound" | "connected";
export type MyLists = { ok: boolean; outgoing: Card[]; inbound: Card[] };

type Counts = Record<Tab, number>;

// Short on purpose: "Invites to me" wraps to two lines at 375px, and the
// dialog heading already says these are invites.
const TABS: [Tab, string][] = [
  ["inbound", "Received"],
  ["outgoing", "Sent"],
  ["connected", "Connected"],
];

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

const isAccepted = (state: CardState) => Boolean(state.matchId && state.matchActive);

function TabRow({
  tab,
  counts,
  onSelect,
}: {
  tab: Tab;
  counts: Counts | null;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <div className="flex gap-1 px-4 pt-3">
      {TABS.map(([key, label]) => {
        const count = counts?.[key] ?? 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              tab === key
                ? "bg-surface-hi text-paper"
                : "text-muted hover:bg-surface/60 hover:text-paper"
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[10.5px] tabular-nums ${
                  key === "connected" ? "bg-mutual/18 text-mutual" : "bg-accent/18 text-accent-hi"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
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

function Empty({ tab }: { tab: Tab }) {
  if (tab === "outgoing") {
    return (
      <EmptyState
        emoji="&#128075;"
        title="You haven&rsquo;t invited anyone yet"
        body="Tap 'Interested to meet' on anyone you'd like to find on the day. They get an invite, and you can undo it any time."
      />
    );
  }
  if (tab === "inbound") {
    return (
      <EmptyState
        emoji="&#9749;"
        title="No invites waiting"
        body="It's early. Put a line on your card about what you're hoping to get out of Config — it gives people a reason to reach out."
      />
    );
  }
  return (
    <EmptyState
      emoji="&#129309;"
      title="No connections yet"
      body="A connection happens when you both say yes. Accept an invite, or send one and wait for them to tap back."
    />
  );
}

/**
 * Reads the optimistic store, so accepting an invite moves that person out of
 * "Invites to me" and into "Connected" — and moves both counters — on the tap
 * rather than on the next reload.
 */
function Body({
  promise,
  tab,
  onSelect,
  onRetry,
}: {
  promise: Promise<MyLists>;
  tab: Tab;
  onSelect: (tab: Tab) => void;
  onRetry: () => void;
}) {
  const lists = use(promise);
  const [declined, setDeclined] = useState<ReadonlySet<string>>(new Set());
  const toast = useToast();

  const outgoing = lists.outgoing;
  const inbound = lists.inbound.filter((card) => !declined.has(card.id));
  const outgoingStates = useCardStates(outgoing);
  const inboundStates = useCardStates(inbound);

  async function decline(card: Card) {
    setDeclined((current) => new Set(current).add(card.id));
    const result = await dismissInbound(card.id);
    if (!result.ok) {
      setDeclined((current) => {
        const next = new Set(current);
        next.delete(card.id);
        return next;
      });
      toast("Could not decline that. Try again.", "bad");
    }
  }

  if (!lists.ok) {
    return (
      <>
        <TabRow tab={tab} counts={null} onSelect={onSelect} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-5">
          <EmptyState
            title="That didn&rsquo;t load"
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
        </div>
      </>
    );
  }

  // One person can sit in both directions at once, so Connected is deduped.
  const connected = new Map<string, Card>();
  outgoing.forEach((card, i) => {
    if (isAccepted(outgoingStates[i])) connected.set(card.id, card);
  });
  inbound.forEach((card, i) => {
    if (isAccepted(inboundStates[i])) connected.set(card.id, card);
  });

  const outgoingPending = outgoing.filter((_, i) => !isAccepted(outgoingStates[i]));
  const inboundPending = inbound.filter((_, i) => !isAccepted(inboundStates[i]));

  const counts: Counts = {
    inbound: inboundPending.length,
    outgoing: outgoingPending.length,
    connected: connected.size,
  };

  const cards =
    tab === "outgoing"
      ? outgoingPending
      : tab === "inbound"
        ? inboundPending
        : [...connected.values()];

  return (
    <>
      <TabRow tab={tab} counts={counts} onSelect={onSelect} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-5">
        {cards.length === 0 ? (
          <Empty tab={tab} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {cards.map((card) => (
              <ProfileCard
                key={card.id}
                card={card}
                footer={
                  tab === "inbound" ? (
                    <button
                      type="button"
                      onClick={() => void decline(card)}
                      className="h-7 w-full rounded-xl border border-line-soft text-[11px] font-medium text-muted-dim transition-colors hover:border-line hover:text-muted"
                    >
                      Decline
                    </button>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
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
        aria-label="My invites"
        className="animate-sheet relative flex max-h-[86svh] w-full flex-col overflow-hidden rounded-t-3xl border border-line-soft bg-ink-soft shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.9)] sm:max-h-[80svh] sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 pt-4 pb-3">
          <h2 className="font-display text-xl text-paper">My invites</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close my invites"
            className="grid size-8 place-items-center rounded-full border border-line-soft text-muted transition-colors hover:border-line hover:text-paper"
          >
            <CloseMark className="size-3.5" />
          </button>
        </div>

        <Suspense
          fallback={
            <>
              <TabRow tab={tab} counts={null} onSelect={setTab} />
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-5">
                <Skeletons />
              </div>
            </>
          }
        >
          <Body promise={promise} tab={tab} onSelect={setTab} onRetry={onRetry} />
        </Suspense>
      </div>
    </div>
  );
}
