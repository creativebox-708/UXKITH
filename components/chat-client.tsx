"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/avatar";
import { BackMark, CloseMark, DotsMark, LinkedInMark, SendMark, SpinnerMark } from "@/components/icons";
import { HereDot } from "@/components/profile-card";
import { useToast } from "@/components/toast";
import { blockUser, reportUser } from "@/lib/actions/safety";
import { createClient } from "@/lib/supabase/client";
import type { Message, ProfileCard } from "@/lib/types";

type Bubble = Message & { pending?: boolean };

const MAX = 2000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Everything is stamped in the venue's time, formatted by hand.
 * toLocaleTimeString(undefined, ...) disagrees between the server (UTC, Node
 * ICU) and the browser (the reader's zone and locale), which React reports as
 * a hydration mismatch and repaints. IST has no DST, so the offset is fixed.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istParts(at: number) {
  const shifted = new Date(at + IST_OFFSET_MS);
  return {
    day: shifted.getUTCDate(),
    month: shifted.getUTCMonth(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    stamp: shifted.toISOString().slice(0, 10),
  };
}

function dayLabel(iso: string) {
  const at = istParts(Date.parse(iso));
  const today = istParts(Date.now());
  const yesterday = istParts(Date.now() - 24 * 60 * 60 * 1000);
  if (at.stamp === today.stamp) return "Today";
  if (at.stamp === yesterday.stamp) return "Yesterday";
  return `${at.day} ${MONTHS[at.month]}`;
}

function timeLabel(iso: string) {
  const { hours, minutes } = istParts(Date.parse(iso));
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

export function ChatClient({
  matchId,
  viewerId,
  partner,
  active,
  initialMessages,
  /** Page mode owns the viewport; dock mode fills whatever box it is given. */
  fill = true,
  onClose,
}: {
  matchId: string;
  viewerId: string;
  partner: ProfileCard;
  active: boolean;
  initialMessages: Message[];
  fill?: boolean;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<Bubble[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState<null | "report" | "block">(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();

  const scrollToEnd = useCallback((smooth = false) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [scrollToEnd]);

  // Live messages from the other side.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) => {
            if (current.some((m) => m.id === incoming.id)) return current;
            // our own echo: swap the optimistic bubble for the stored row
            if (incoming.sender === viewerId) {
              const pendingIndex = current.findIndex((m) => m.pending && m.body === incoming.body);
              if (pendingIndex !== -1) {
                const next = [...current];
                next[pendingIndex] = incoming;
                return next;
              }
            }
            return [...current, incoming];
          });
          requestAnimationFrame(() => scrollToEnd(true));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matchId, viewerId, scrollToEnd]);

  // Quietly mark what the other person sent as read.
  useEffect(() => {
    const unread = messages.filter((m) => m.sender !== viewerId && !m.read_at && !m.pending);
    if (unread.length === 0) return;
    const supabase = createClient();
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in(
        "id",
        unread.map((m) => m.id),
      );
  }, [messages, viewerId]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending || !active) return;

    const temp: Bubble = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      sender: viewerId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
      pending: true,
    };

    setMessages((current) => [...current, temp]);
    setDraft("");
    setSending(true);
    requestAnimationFrame(() => scrollToEnd(true));

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender: viewerId, body })
      .select()
      .single();

    setSending(false);

    if (error || !data) {
      setMessages((current) => current.filter((m) => m.id !== temp.id));
      setDraft(body);
      toast("That didn't send. Try again.", "bad");
      return;
    }

    setMessages((current) => {
      if (current.some((m) => m.id === data.id)) return current.filter((m) => m.id !== temp.id);
      return current.map((m) => (m.id === temp.id ? data : m));
    });
  }

  async function submitReport() {
    setWorking(true);
    const result = await reportUser({ reported: partner.id, matchId, reason });
    setWorking(false);
    setSheet(null);
    setReason("");
    toast(
      result.ok ? "Reported. Our team will look at it." : "Could not send that. Try again.",
      result.ok ? "good" : "bad",
    );
  }

  async function confirmBlock() {
    setWorking(true);
    const result = await blockUser(partner.id);
    setWorking(false);
    if (!result.ok) {
      setSheet(null);
      toast("Could not block them. Try again.", "bad");
      return;
    }
    onClose?.();
    if (!onClose) router.replace("/home");
    router.refresh();
  }

  const rows = messages.map((message, i) => {
    const day = dayLabel(message.created_at);
    const previous = i > 0 ? dayLabel(messages[i - 1].created_at) : null;
    return { message, day, showDay: day !== previous };
  });

  return (
    <div className={fill ? "flex h-[100svh] flex-col pb-(--footer-h)" : "flex h-full min-h-0 flex-col"}>
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line-soft bg-ink/85 px-3 backdrop-blur-xl">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-paper"
          >
            <CloseMark className="size-3.5" />
          </button>
        ) : (
          <Link
            href="/home"
            aria-label="Back to home"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-paper"
          >
            <BackMark className="size-4" />
          </Link>
        )}

        <div className="relative shrink-0">
          <Avatar name={partner.full_name} src={partner.avatar_url} size={34} />
          {partner.is_here && <HereDot className="absolute -right-0.5 -bottom-0.5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] leading-tight font-semibold text-paper">
            {partner.full_name}
          </p>
          <p className="truncate text-[11.5px] text-muted-dim">
            {partner.is_here ? "At Config now" : (partner.headline ?? "Mutual interest")}
          </p>
        </div>

        {partner.linkedin_url && (
          <a
            href={partner.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${partner.full_name} on LinkedIn`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-dim transition-colors hover:bg-surface hover:text-[#0a66c2]"
          >
            <LinkedInMark className="size-[14px]" />
          </a>
        )}

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Chat options"
            aria-expanded={menuOpen}
            className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-paper"
          >
            <DotsMark className="size-3.5" />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="animate-fade absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-line-soft bg-ink-soft shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)]">
                {partner.linkedin_url && (
                  <a
                    href={partner.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 border-b border-line-soft px-3.5 py-2.5 text-[13px] text-paper transition-colors hover:bg-surface"
                  >
                    <LinkedInMark className="size-[13px] text-muted-dim" />
                    Connect on LinkedIn
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setSheet("report");
                  }}
                  className="block w-full px-3.5 py-2.5 text-left text-[13px] text-paper transition-colors hover:bg-surface"
                >
                  Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setSheet("block");
                  }}
                  className="block w-full border-t border-line-soft px-3.5 py-2.5 text-left text-[13px] text-accent-hi transition-colors hover:bg-surface"
                >
                  Block
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-1.5">
          <p className="mx-auto mb-3 max-w-xs text-center text-[11.5px] leading-relaxed text-muted-dim">
            You both said you want to meet. Messages stay here &mdash; no phone numbers are shared.
          </p>

          {rows.map(({ message, day, showDay }) => {
            const mine = message.sender === viewerId;

            return (
              <div key={message.id}>
                {showDay && (
                  <p className="py-3 text-center text-[10.5px] tracking-wide text-muted-dim uppercase">
                    {day}
                  </p>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug wrap-anywhere ${
                      mine
                        ? "rounded-br-md bg-accent text-accent-ink"
                        : "rounded-bl-md border border-line-soft bg-surface text-paper"
                    } ${message.pending ? "opacity-60" : ""}`}
                  >
                    {message.body}
                    <span
                      className={`mt-0.5 block text-[10px] tabular-nums ${
                        mine ? "text-accent-ink/55" : "text-muted-dim"
                      }`}
                    >
                      {message.pending ? "Sending…" : timeLabel(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {active ? (
        <form
          onSubmit={send}
          className="flex shrink-0 items-end gap-2 border-t border-line-soft bg-ink/85 px-3 py-2.5 backdrop-blur-xl"
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(event);
              }
            }}
            rows={1}
            placeholder="Say hello"
            aria-label="Message"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-line-soft bg-surface/70 px-3.5 py-2.5 text-[15px] leading-snug text-paper placeholder:text-muted-dim focus:border-line focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition-all duration-200 enabled:hover:bg-accent-hi enabled:active:scale-95 disabled:bg-surface disabled:text-muted-dim"
          >
            {sending ? <SpinnerMark className="size-4" /> : <SendMark className="size-4" />}
          </button>
        </form>
      ) : (
        <div className="shrink-0 border-t border-line-soft bg-ink/85 px-4 py-3.5 text-center text-[12.5px] leading-relaxed text-muted-dim backdrop-blur-xl">
          One of you undid the interest, so this conversation is read-only. Everything said is still
          here.
        </div>
      )}

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheet(null)}
            className="animate-fade absolute inset-0 bg-ink/85 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="animate-sheet relative w-full rounded-t-3xl border border-line-soft bg-ink-soft p-5 sm:max-w-md sm:rounded-3xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="font-display text-xl text-paper">
                {sheet === "report" ? "Report this person" : `Block ${partner.full_name}?`}
              </h2>
              <button
                type="button"
                onClick={() => setSheet(null)}
                aria-label="Close"
                className="grid size-7 shrink-0 place-items-center rounded-full border border-line-soft text-muted hover:text-paper"
              >
                <CloseMark className="size-3" />
              </button>
            </div>

            {sheet === "report" ? (
              <>
                <p className="text-[13px] leading-relaxed text-muted">
                  Tell us what happened. A person on our team reads every report by hand.
                </p>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value.slice(0, 1000))}
                  rows={4}
                  placeholder="What happened?"
                  className="mt-3 w-full resize-none rounded-xl border border-line-soft bg-surface/70 px-3.5 py-2.5 text-[15px] text-paper placeholder:text-muted-dim focus:border-line focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void submitReport()}
                  disabled={working}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-paper text-[14px] font-semibold text-ink disabled:opacity-60"
                >
                  {working && <SpinnerMark className="size-4" />}
                  Send report
                </button>
              </>
            ) : (
              <>
                <p className="text-[13px] leading-relaxed text-muted">
                  You two disappear from each other everywhere in UXKITH, and this chat closes.
                  They are not told. You can&rsquo;t undo this in the app.
                </p>
                <button
                  type="button"
                  onClick={() => void confirmBlock()}
                  disabled={working}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[14px] font-semibold text-accent-ink disabled:opacity-60"
                >
                  {working && <SpinnerMark className="size-4" />}
                  Block {partner.full_name}
                </button>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  className="mt-2 h-11 w-full rounded-xl text-[14px] font-medium text-muted hover:text-paper"
                >
                  Keep the chat
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
