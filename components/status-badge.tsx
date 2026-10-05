"use client";

import { useCardState } from "@/lib/card-store";
import { connectionStatus, STATUS_LABEL, type ProfileCard } from "@/lib/types";

/** Reads the optimistic store, so the badge flips the moment the button does. */
export function StatusBadge({ card }: { card: ProfileCard }) {
  const state = useCardState(card);
  const status = connectionStatus({
    ...card,
    i_am_interested: state.interested,
    match_id: state.matchId,
    match_active: state.matchActive,
  });

  if (status === "none") return null;

  const tone =
    status === "accepted"
      ? "border-mutual/35 bg-mutual/12 text-mutual"
      : status === "invited_you"
        ? "border-accent/40 bg-accent/12 text-accent-hi"
        : "border-line bg-surface-hi text-muted";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold tracking-[0.06em] uppercase ${tone}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
