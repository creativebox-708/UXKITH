import Link from "next/link";

import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-6 pb-[calc(var(--footer-h)+2rem)]">
      <Wordmark className="mb-7" muted />
      <p className="text-[12px] font-semibold tracking-[0.14em] text-muted-dim">404</p>
      <h1 className="mt-2 font-display text-[1.75rem] leading-tight text-paper">
        Nothing lives at this address.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        The link may be old, or the person may have deleted their account.
      </p>
      <Link
        href="/home"
        className="mt-6 flex h-11 items-center justify-center rounded-xl bg-paper text-[14px] font-semibold text-ink"
      >
        Back to home
      </Link>
    </main>
  );
}
