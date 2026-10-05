"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { ChatClient } from "@/components/chat-client";
import { SpinnerMark } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { toCards, type Message, type ProfileCard } from "@/lib/types";

type Loaded = {
  partner: ProfileCard;
  active: boolean;
  messages: Message[];
};

const ChatDockContext = createContext<((matchId: string) => void) | null>(null);

/**
 * Opens a conversation without leaving the page. Returns null outside the
 * provider, so a card rendered on a route with no dock can fall back to the
 * full-page /chat/[matchId] route instead.
 */
export function useOpenChat() {
  return useContext(ChatDockContext);
}

function DockShell({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 sm:pointer-events-none">
      {/* The scrim is mobile-only: on a wide screen the dock floats over a page
          that stays usable behind it. */}
      <button
        type="button"
        aria-label="Close chat"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-ink/70 backdrop-blur-sm sm:hidden"
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Conversation"
        className="animate-sheet pointer-events-auto absolute inset-x-0 bottom-0 flex h-[82svh] flex-col overflow-hidden rounded-t-3xl border border-line-soft bg-ink-soft shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.9)] sm:inset-x-auto sm:right-5 sm:bottom-[calc(var(--footer-h)+1rem)] sm:h-[min(34rem,calc(100svh-8rem))] sm:w-[23rem] sm:rounded-2xl"
      >
        {children}
      </div>
    </div>
  );
}

export function ChatDockProvider({
  viewerId,
  children,
}: {
  viewerId: string;
  children: ReactNode;
}) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  const open = useCallback((id: string) => {
    setMatchId(id);
    setData(null);
    setFailed(false);
  }, []);

  const close = useCallback(() => {
    setMatchId(null);
    setData(null);
    setFailed(false);
  }, []);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    // Not an effect that sets state synchronously: everything below is awaited,
    // and the result is dropped if the dock closed meanwhile.
    void (async () => {
      const supabase = createClient();
      const [match, partnerRows, messages] = await Promise.all([
        supabase.from("matches").select("id, active").eq("id", matchId).maybeSingle(),
        supabase.rpc("match_partner", { p_match_id: matchId }),
        supabase
          .from("messages")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true })
          .limit(500),
      ]);

      if (cancelled) return;

      const partner = toCards(partnerRows.data)[0];
      if (!match.data || !partner) {
        setFailed(true);
        return;
      }

      setData({
        partner,
        active: match.data.active,
        messages: messages.data ?? [],
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return (
    <ChatDockContext.Provider value={open}>
      {children}

      {matchId && (
        <DockShell onClose={close}>
          {failed ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-[14px] font-semibold text-paper">This conversation is closed</p>
              <p className="text-[12.5px] leading-relaxed text-muted">
                One of you undid the interest, or blocked the other.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-1 h-9 rounded-xl border border-line px-4 text-[13px] font-medium text-paper transition-colors hover:bg-surface"
              >
                Close
              </button>
            </div>
          ) : !data ? (
            <div className="flex flex-1 items-center justify-center text-muted-dim">
              <SpinnerMark className="size-5" />
            </div>
          ) : (
            <ChatClient
              key={matchId}
              matchId={matchId}
              viewerId={viewerId}
              partner={data.partner}
              active={data.active}
              initialMessages={data.messages}
              fill={false}
              onClose={close}
            />
          )}
        </DockShell>
      )}
    </ChatDockContext.Provider>
  );
}
