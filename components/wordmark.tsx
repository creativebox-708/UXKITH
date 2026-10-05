import Link from "next/link";

/** One source of truth for the mark, so it cannot drift between pages. */
export function BetaBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`shrink-0 rounded-full border border-accent/35 bg-accent/12 px-1.5 py-px text-[9px] font-semibold tracking-[0.08em] text-accent-hi uppercase ${className}`}
    >
      Beta
    </span>
  );
}

export function Wordmark({
  href,
  muted = false,
  className = "",
}: {
  /** Renders as a link when set; plain text otherwise. */
  href?: string;
  muted?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden />
      <span
        className={`text-[12.5px] font-semibold tracking-[0.12em] ${muted ? "text-muted" : "text-paper"}`}
      >
        THEDESIGNVIBE
      </span>
      <BetaBadge />
    </>
  );

  const classes = `flex shrink-0 items-center gap-2 ${className}`;

  return href ? (
    <Link href={href} className={classes} aria-label="thedesignvibe, beta">
      {inner}
    </Link>
  ) : (
    <span className={classes}>{inner}</span>
  );
}
