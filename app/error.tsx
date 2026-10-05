"use client";

import { useEffect } from "react";

import { Wordmark } from "@/components/wordmark";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-6 pb-[calc(var(--footer-h)+2rem)]">
      <Wordmark className="mb-7" muted />
      <h1 className="font-display text-[1.75rem] leading-tight text-paper">
        That didn&rsquo;t go to plan.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Something broke on our side. Nothing you did caused it, and nothing was lost.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-11 rounded-xl bg-paper text-[14px] font-semibold text-ink transition-transform active:scale-[0.99]"
      >
        Try again
      </button>
    </main>
  );
}
