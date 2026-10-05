"use client";

import { Avatar } from "@/components/avatar";
import { ConnectLink } from "@/components/connect-link";
import { InterestButton, InterestCount } from "@/components/interest-button";
import { StatusBadge } from "@/components/status-badge";
import { LinkedInMark } from "@/components/icons";
import type { ProfileCard as Card } from "@/lib/types";

export function HereDot({ className = "" }: { className?: string }) {
  // The positioning the caller passes lands on the outer span; the stacking of
  // the halo and the dot is kept in its own relative wrapper.
  return (
    <span className={`flex size-2 ${className}`} title="At Config now">
      <span className="relative flex size-2">
        <span className="animate-halo absolute inset-0 rounded-full bg-mutual" />
        <span className="relative size-2 rounded-full bg-mutual ring-2 ring-ink" />
      </span>
    </span>
  );
}

/**
 * The one card used by home, browse and the my-list modal. Sized to survive a
 * two-column grid on a 380px phone. No emoji here by design.
 */
export function ProfileCard({
  card,
  footer,
}: {
  card: Card;
  /** Sits under the primary button — used by the inbound tab for Dismiss. */
  footer?: React.ReactNode;
}) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line-soft bg-surface/70 p-3 transition-colors duration-200 hover:border-line">
      <div className="flex items-start justify-between gap-2">
        <div className="relative">
          <Avatar name={card.full_name} src={card.avatar_url} size={42} />
          {card.is_here && <HereDot className="absolute -right-0.5 -bottom-0.5" />}
        </div>

        {card.linkedin_url && (
          <a
            href={card.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${card.full_name} on LinkedIn`}
            className="-m-1.5 p-1.5 text-muted-dim transition-colors hover:text-[#0a66c2]"
          >
            <LinkedInMark className="size-[13px]" />
          </a>
        )}
      </div>

      <div className="mt-2.5 empty:hidden">
        <StatusBadge card={card} />
      </div>

      <h3 className="mt-1 text-[13.5px] leading-tight font-semibold tracking-[-0.01em] text-paper clamp-2">
        {card.full_name}
      </h3>

      {card.headline && (
        <p className="mt-1 text-[11.5px] leading-snug text-muted clamp-2">{card.headline}</p>
      )}

      {card.company && (
        <p className="mt-0.5 truncate text-[11.5px] text-muted-dim">{card.company}</p>
      )}

      {card.hoping_to_get && (
        <p className="mt-2 border-l border-line pl-2 text-[11px] leading-snug text-muted/90 clamp-3">
          {card.hoping_to_get}
        </p>
      )}

      <div className="mt-auto pt-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <InterestCount card={card} />
          {card.city && <span className="truncate text-[11px] text-muted-dim">{card.city}</span>}
        </div>
        <InterestButton card={card} />
        <div className="mt-1.5 empty:hidden">
          <ConnectLink card={card} />
        </div>
        {footer && <div className="mt-1.5">{footer}</div>}
      </div>
    </article>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line-soft bg-surface/40 p-3">
      <div className="skeleton size-[42px] rounded-full" />
      <div className="skeleton mt-3.5 h-3 w-3/4 rounded" />
      <div className="skeleton mt-2 h-2.5 w-full rounded" />
      <div className="skeleton mt-1.5 h-2.5 w-2/3 rounded" />
      <div className="skeleton mt-auto h-8 w-full rounded-xl" />
    </div>
  );
}
