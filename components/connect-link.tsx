"use client";

import { LinkedInMark } from "@/components/icons";
import { useCardState } from "@/lib/card-store";
import type { ProfileCard } from "@/lib/types";

/**
 * Shown once you have tapped the button on someone, whether or not they have
 * tapped back. An invite can sit unseen for days — people sign in, look round
 * and leave — and LinkedIn is the only way to reach somebody who is not in the
 * app. The profile link is already on every card as an icon, so this exposes
 * nothing new; it just makes the one working channel findable.
 *
 * Deliberately not shown on a card you have not tapped: the app should not be
 * a directory for cold outreach. The terms still govern what happens next —
 * someone who has gone quiet, declined or blocked you has answered.
 */
export function ConnectLink({ card, size = "sm" }: { card: ProfileCard; size?: "sm" | "md" }) {
  const state = useCardState(card);
  if (!state.interested || !card.linkedin_url) return null;

  const connected = Boolean(state.matchId && state.matchActive);

  return (
    <a
      href={card.linkedin_url}
      target="_blank"
      rel="noopener noreferrer"
      title={
        connected
          ? `Open ${card.full_name} on LinkedIn`
          : `Open ${card.full_name} on LinkedIn — they may not have seen your invite yet`
      }
      className={`flex w-full items-center justify-center gap-1.5 rounded-xl border border-line-soft font-medium text-muted transition-colors hover:border-line hover:text-paper ${
        size === "md" ? "h-10 text-[13px]" : "h-7 text-[11px]"
      }`}
    >
      <LinkedInMark className={size === "md" ? "size-[14px]" : "size-[11px]"} />
      Connect on LinkedIn
    </a>
  );
}
