import { Countdown } from "@/components/countdown";
import { FlickeringGrid } from "@/components/flickering-grid";
import { Wordmark } from "@/components/wordmark";
import { EVENT } from "@/lib/event";

import { SignInForm } from "./sign-in-form";

/**
 * The actual mechanic, in the order it happens, worded to match what the app
 * really does. It sits above the sign-in button on purpose: nobody should have
 * to hand over a LinkedIn account to find out what the thing is.
 */
const STEPS = [
  { emoji: "🔑", lead: "Sign in with LinkedIn.", rest: "Nothing else is asked." },
  { emoji: "🔍", lead: "Find your people.", rest: "Search, then show interest." },
  { emoji: "🤝", lead: "They tap back.", rest: "That’s a match — only then." },
  { emoji: "💬", lead: "Chat, then meet.", rest: "Sort out where, on the day." },
];

export default function LandingPage() {
  return (
    <main className="relative flex h-[100svh] items-center justify-center overflow-hidden px-6 pt-14 pb-(--footer-h) sm:px-8 sm:pt-16">
      {/* Vignette: the grid lives at the edges and clears out of the middle,
          so the centred column never has to be read through it. */}
      <div className="pointer-events-none absolute inset-0 -z-10 [-webkit-mask-image:radial-gradient(ellipse_78%_58%_at_50%_48%,transparent_30%,black_88%)] [mask-image:radial-gradient(ellipse_78%_58%_at_50%_48%,transparent_30%,black_88%)]">
        <FlickeringGrid color="#ff5c38" maxOpacity={0.22} flickerChance={0.22} />
      </div>

      {/* Slim header, pinned out of the flow so the column centres on the true
          viewport. The clock lives up here rather than in the column, so the
          headline is the only thing competing for attention. */}
      <header className="absolute inset-x-6 top-[max(1.25rem,env(safe-area-inset-top))] flex items-center justify-between gap-3 sm:inset-x-8">
        <Wordmark />
        <Countdown className="shrink-0" />
      </header>

      <div className="animate-rise w-full max-w-xl text-center">
        <h1 className="font-display text-[clamp(1.5rem,7vw,2.125rem)] leading-[1.1] tracking-[-0.015em] text-balance text-paper sm:text-[2.75rem] sm:leading-[1.06]">
          India&rsquo;s first Config. One day. Don&rsquo;t spend it walking past the people you came
          to meet.
        </h1>

        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-balance text-muted sm:text-base">
          Find the ones you came to meet, before the doors open.
        </p>

        <div className="mx-auto mt-5 w-full max-w-sm sm:mt-6">
          <SignInForm />
        </div>

        <div className="mx-auto mt-4 w-full max-w-sm rounded-2xl border border-line-soft bg-surface/40 px-4 py-3 text-left">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-muted-dim uppercase">
            How it works
          </p>
          <ol className="mt-2 flex flex-col gap-1.5">
            {STEPS.map((step) => (
              <li
                key={step.lead}
                className="flex items-start gap-2.5 text-[11.5px] leading-snug text-muted-dim"
              >
                <span aria-hidden className="w-4 shrink-0 text-[12px]">
                  {step.emoji}
                </span>
                <span>
                  <span className="font-medium text-paper">{step.lead}</span> {step.rest}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mx-auto mt-3 max-w-sm text-[11px] leading-snug text-balance text-muted-dim">
          {EVENT.dateLabel} &middot; {EVENT.venueShort} &middot; {EVENT.format}
        </p>

        {/* Said plainly and up front, not only in the terms. */}
        <p className="mx-auto mt-1 max-w-sm text-[10.5px] leading-snug text-balance text-muted-dim">
          Independent and unofficial &mdash; not affiliated with or endorsed by Figma.{" "}
          <a
            href={EVENT.officialUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="whitespace-nowrap text-muted underline decoration-line underline-offset-2 transition-colors hover:text-paper hover:decoration-accent"
          >
            Official event details
          </a>
        </p>
      </div>
    </main>
  );
}
