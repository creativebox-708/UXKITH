"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/avatar";
import { useOpenChat } from "@/components/chat-dock";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";
import { toNotifications, type AppNotification } from "@/lib/types";

function BellMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2.1a4 4 0 0 0-4 4v2.3L2.9 10.6a.5.5 0 0 0 .45.73h9.3a.5.5 0 0 0 .45-.73L12 8.4V6.1a4 4 0 0 0-4-4Z" />
      <path d="M6.4 12.6a1.75 1.75 0 0 0 3.2 0" />
    </svg>
  );
}

function ago(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsBell({ initial }: { initial: AppNotification[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const openChat = useOpenChat();
  const toast = useToast();

  // Remembered so a refresh can tell what is genuinely new since last look,
  // rather than re-announcing everything on every poll.
  const announced = useRef(new Set(initial.map((n) => `${n.kind}:${n.actorId}`)));
  const unread = items.filter((n) => n.isNew).length;

  useEffect(() => {
    const refresh = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("notifications", { p_limit: 20 });
      if (error) return;

      const next = toNotifications(data);
      setItems(next);

      // The moment the app exists for: somebody tapped it back.
      for (const n of next) {
        const key = `${n.kind}:${n.actorId}`;
        if (announced.current.has(key)) continue;
        announced.current.add(key);
        if (!n.isNew) continue;
        toast(
          n.kind === "accepted"
            ? `${n.actorName} accepted — your chat is open.`
            : `${n.actorName} wants to meet you.`,
          n.kind === "accepted" ? "good" : "neutral",
        );
      }
    };

    const id = window.setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [toast]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || unread === 0) return;

    // Opening the panel is the "seen" signal.
    setItems((current) => current.map((n) => ({ ...n, isNew: false })));
    void createClient().rpc("mark_notifications_seen");
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        className="relative grid size-8 place-items-center rounded-full border border-line-soft bg-surface/60 text-muted transition-colors hover:border-line hover:text-paper"
      >
        <BellMark className="size-[15px]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-[15px] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="animate-fade fixed inset-0 z-10 cursor-default bg-ink/70 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
          />
          {/* Anchored to the bell on a wide screen; a sheet on a phone, where a
              dropdown hung off this button would run past the left edge. */}
          <div className="animate-fade absolute top-[calc(100%+0.5rem)] right-0 z-20 max-h-[min(22rem,60svh)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line-soft bg-ink-soft shadow-[0_18px_44px_-16px_rgba(0,0,0,0.9)]">
            <p className="sticky top-0 border-b border-line-soft bg-ink-soft px-4 py-2.5 text-[9.5px] font-semibold tracking-[0.14em] text-muted-dim uppercase">
              Notifications
            </p>

            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12.5px] leading-relaxed text-muted">
                Nothing yet. When someone taps &ldquo;Interested to meet&rdquo; on your card, it
                shows up here.
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {items.map((n) => (
                  <li key={`${n.kind}:${n.actorId}`}>
                    <button
                      type="button"
                      disabled={n.kind !== "accepted" || !n.matchId || !openChat}
                      onClick={() => {
                        if (n.kind === "accepted" && n.matchId && openChat) {
                          setOpen(false);
                          openChat(n.matchId);
                        }
                      }}
                      className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors enabled:hover:bg-surface/60 disabled:cursor-default"
                    >
                      <Avatar name={n.actorName} src={n.actorAvatar} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] leading-snug text-muted">
                          <span aria-hidden>{n.kind === "accepted" ? "🤝 " : "👋 "}</span>
                          <span className="font-semibold text-paper">{n.actorName}</span>{" "}
                          {n.kind === "accepted"
                            ? "accepted — your chat is open."
                            : "wants to meet you."}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-muted-dim">
                          {ago(n.happenedAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
