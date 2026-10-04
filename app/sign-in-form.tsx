"use client";

import Link from "next/link";
import { useState } from "react";

import { CheckMark, LinkedInMark, SpinnerMark } from "@/components/icons";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";

export function SignInForm() {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function signIn() {
    if (!agreed || busy) return;
    setBusy(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        // `terms=1` is only reachable by ticking the box above, so the callback
        // uses it to stamp agreed_terms_at.
        redirectTo: `${window.location.origin}/auth/callback?terms=1`,
      },
    });

    if (error) {
      setBusy(false);
      toast("Could not reach LinkedIn. Try once more.", "bad");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The input itself is the visible box. A <label> wrapping the Terms link
          would swallow taps, because an anchor is interactive content and a
          label does not forward activation through it. */}
      <div className="flex items-start justify-center gap-3 text-left text-[13px] leading-snug text-muted">
        <span className={`relative mt-px inline-flex shrink-0 ${agreed ? "animate-pop" : ""}`}>
          <input
            id="agree-terms"
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className={`size-[19px] cursor-pointer appearance-none rounded-[6px] border transition-colors duration-200 ${
              agreed ? "border-accent bg-accent" : "border-line bg-surface hover:border-muted-dim"
            }`}
          />
          <CheckMark
            aria-hidden
            className={`pointer-events-none absolute inset-0 m-auto size-3 text-accent-ink transition-opacity duration-150 ${
              agreed ? "opacity-100" : "opacity-0"
            }`}
          />
        </span>
        <span className="select-none">
          <label htmlFor="agree-terms" className="cursor-pointer">
            I agree to the{" "}
          </label>
          <Link
            href="/terms"
            className="text-paper underline decoration-line underline-offset-[3px] transition-colors hover:decoration-accent"
          >
            Terms and Privacy note
          </Link>
          <label htmlFor="agree-terms" className="cursor-pointer">
            .
          </label>
        </span>
      </div>

      <button
        type="button"
        onClick={signIn}
        disabled={!agreed || busy}
        className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-paper text-[15px] font-semibold tracking-[-0.01em] text-ink transition-all duration-200 enabled:hover:-translate-y-px enabled:hover:shadow-[0_14px_34px_-16px_rgba(246,243,238,0.65)] enabled:active:translate-y-0 enabled:active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted-dim"
      >
        {busy ? (
          <SpinnerMark className="size-4" />
        ) : (
          <LinkedInMark className={`size-[17px] ${agreed ? "text-[#0a66c2]" : ""}`} />
        )}
        {busy ? "Taking you to LinkedIn…" : "Continue with LinkedIn"}
      </button>

      <p className="text-center text-[12px] tracking-wide text-muted-dim">No phone number. Ever.</p>
    </div>
  );
}
