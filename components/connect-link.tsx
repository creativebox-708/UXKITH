"use client";

import { LinkedInMark } from "@/components/icons";
import { useCardState } from "@/lib/card-store";
import type { ProfileCard } from "@/lib/types";

/**
 * The step after the chat: actually keep the person. Only shown once the
 * interest runs both ways — before that, nobody has agreed to be found.
 */
export function ConnectLink({ card, size = "sm" }: { card: ProfileCard; size?: "sm" | "md" }) {
  const state = useCardState(card);
  if (!state.matchId || !state.matchActive || !card.linkedin_url) return null;

  return (
    <a
      href={card.linkedin_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-full items-center justify-center gap-1.5 rounded-xl border border-line-soft font-medium text-muted transition-colors hover:border-line hover:text-paper ${
        size === "md" ? "h-10 text-[13px]" : "h-7 text-[11px]"
      }`}
    >
      <LinkedInMark className={size === "md" ? "size-[14px]" : "size-[11px]"} />
      Connect on LinkedIn
    </a>
  );
}
