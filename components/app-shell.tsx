"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

import { ChatDockProvider } from "@/components/chat-dock";
import { loadMyLists, MyListModal, type MyLists, type Tab } from "@/components/my-list-modal";
import { NotificationsBell } from "@/components/notifications";
import { HereDot } from "@/components/profile-card";
import { Wordmark } from "@/components/wordmark";
import { useToast } from "@/components/toast";
import { setHere } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/types";

const nf = new Intl.NumberFormat("en-IN");

export type ShellCounts = { attendees: number; inbound: number; myList: number };

function SettingsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <path d="M2.2 4.6h11.6M2.2 11.4h11.6" />
      <circle cx="6" cy="4.6" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="10.4" cy="11.4" r="1.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AppShell({
  viewerId,
  counts,
  eventDay,
  isHere,
  notifications,
  showInboundBanner = false,
  children,
}: {
  viewerId: string;
  counts: ShellCounts;
  eventDay: boolean;
  isHere: boolean;
  notifications: AppNotification[];
  showInboundBanner?: boolean;
  children: React.ReactNode;
}) {
  const [live, setLive] = useState(counts);
  const [here, setHereLocal] = useState(isHere);
  const [modal, setModal] = useState<{ tab: Tab; lists: Promise<MyLists> } | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const [attendees, inbound, myList] = await Promise.all([
      supabase.rpc("attendee_count"),
      supabase.rpc("inbound_count"),
      supabase.rpc("outgoing_pending_count"),
    ]);
    setLive((current) => ({
      attendees: attendees.data ?? current.attendees,
      inbound: inbound.data ?? current.inbound,
      myList: myList.data ?? current.myList,
    }));
  }, []);

  // "Live" enough for a one-day event, without putting profiles on the wire.
  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  // Starting the fetch here means it is already in flight when the sheet paints.
  function openList(tab: Tab) {
    setModal({ tab, lists: loadMyLists() });
  }

  function closeModal() {
    setModal(null);
    void refresh();
  }

  function sayHere() {
    if (here || pending) return;
    setHereLocal(true);
    startTransition(async () => {
      const result = await setHere();
      if (!result.ok) {
        setHereLocal(false);
        toast("Could not mark you as here. Try again.", "bad");
        return;
      }
      toast("You're on the floor. Your matches know.", "good");
    });
  }

  return (
    <ChatDockProvider viewerId={viewerId}>
      <header className="sticky top-0 z-30 border-b border-line-soft bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4">
          {/* The mark holds the left on every screen. At 375px the live count
              and the event-day button drop to a second row rather than being
              squeezed next to it. */}
          <div className="flex h-12 items-center justify-between gap-3 sm:h-14">
            <div className="flex min-w-0 items-center gap-3">
              <Wordmark href="/home" />
              <span className="hidden truncate text-[12.5px] text-muted sm:inline">
                <span className="font-semibold tabular-nums text-paper">
                  {nf.format(live.attendees)}
                </span>{" "}
                designers on UXKITH
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {eventDay && here && (
                <span className="flex h-8 items-center gap-1.5 rounded-full border border-mutual/35 bg-mutual/12 px-2.5 text-[11.5px] font-semibold text-mutual">
                  <HereDot />
                  Here
                </span>
              )}
              {eventDay && !here && (
                <button
                  type="button"
                  onClick={sayHere}
                  className="hidden h-8 rounded-full bg-accent px-3 text-[11.5px] font-semibold text-accent-ink transition-all duration-200 hover:bg-accent-hi active:scale-[0.97] sm:block"
                >
                  I&rsquo;m here <span aria-hidden>&#128075;</span>
                </button>
              )}

              <NotificationsBell initial={notifications} />

              <button
                type="button"
                onClick={() => openList("outgoing")}
                aria-label={`My invites, ${live.myList} awaiting an answer`}
                className="flex h-8 items-center gap-1.5 rounded-full border border-line-soft bg-surface/60 px-2.5 text-[12px] font-medium text-muted transition-colors hover:border-line hover:text-paper"
              >
                <span className="tabular-nums">{live.myList}</span>
                <span className="hidden sm:inline">invites sent</span>
              </button>

              <Link
                href="/settings"
                aria-label="Settings"
                className="grid size-8 place-items-center rounded-full border border-line-soft bg-surface/60 text-muted transition-colors hover:border-line hover:text-paper"
              >
                <SettingsMark className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pb-2 sm:hidden">
            <span className="truncate text-[11.5px] text-muted">
              <span className="font-semibold tabular-nums text-paper">
                {nf.format(live.attendees)}
              </span>{" "}
              designers on UXKITH
            </span>
            {eventDay && !here && (
              <button
                type="button"
                onClick={sayHere}
                className="h-7 shrink-0 rounded-full bg-accent px-2.5 text-[11px] font-semibold text-accent-ink transition-all duration-200 hover:bg-accent-hi active:scale-[0.97]"
              >
                I&rsquo;m here <span aria-hidden>&#128075;</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {showInboundBanner && live.inbound > 0 && (
        <div className="mx-auto w-full max-w-5xl px-4 pt-4">
          <button
            type="button"
            onClick={() => openList("inbound")}
            className="animate-rise flex w-full items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-left transition-colors hover:bg-accent/15"
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base" aria-hidden>
                &#128075;
              </span>
              <span className="text-[13.5px] leading-snug font-medium text-paper">
                {live.inbound === 1
                  ? "1 person wants to meet you"
                  : `${nf.format(live.inbound)} people want to meet you`}
              </span>
            </span>
            <span className="shrink-0 text-[12px] font-medium text-accent-hi">See who</span>
          </button>
        </div>
      )}

      {children}

      {modal && (
        <MyListModal
          promise={modal.lists}
          initialTab={modal.tab}
          onClose={closeModal}
          onRetry={() => openList(modal.tab)}
        />
      )}
    </ChatDockProvider>
  );
}
