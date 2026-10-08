import type { ProfileCard } from "@/lib/types";

/**
 * Says this person answered yes to "did you receive a Config invite?".
 * Absence means they have not answered yet, not that they said no — nobody is
 * marked as lacking an invite, because the honest answer is that we cannot
 * check and do not try to.
 */
export function InviteBadge({
  card,
  className = "",
}: {
  card: Pick<ProfileCard, "invite_confirmed">;
  className?: string;
}) {
  if (!card.invite_confirmed) return null;

  return (
    <span
      title="Confirmed they received a Config India 2026 invite"
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-mutual/35 bg-mutual/12 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.04em] text-mutual uppercase ${className}`}
    >
      <svg viewBox="0 0 12 12" aria-hidden className="size-[9px]" fill="currentColor">
        <path d="M6 .8a5.2 5.2 0 1 0 0 10.4A5.2 5.2 0 0 0 6 .8Zm2.6 4.05L5.5 7.95a.6.6 0 0 1-.85 0L3.4 6.7a.6.6 0 1 1 .85-.85l.83.82 2.67-2.67a.6.6 0 0 1 .85.85Z" />
      </svg>
      Invited
    </span>
  );
}
