import { Countdown } from "@/components/countdown";
import { FlickeringGrid } from "@/components/flickering-grid";
import { Wordmark } from "@/components/wordmark";
import { EVENT } from "@/lib/event";

import { SignInForm } from "./sign-in-form";

export default function LandingPage() {
  return (
    <main className="relative flex h-[100svh] items-center justify-center overflow-hidden px-6 pb-(--footer-h) sm:px-8">
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
        <h1 className="font-display text-[clamp(1.75rem,8vw,2.125rem)] leading-[1.1] tracking-[-0.015em] text-balance text-paper sm:text-[2.75rem] sm:leading-[1.06]">
          India&rsquo;s first Config. One day. Don&rsquo;t spend it walking past the people you came
          to meet.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-balance text-muted sm:text-base">
          Find the ones you came to meet, before the doors open.
        </p>

        <p className="mx-auto mt-5 max-w-sm text-[11px] leading-snug text-balance text-muted-dim">
          {EVENT.dateLabel} &middot; {EVENT.venueShort} &middot; {EVENT.format}
        </p>

        <div className="mx-auto mt-6 w-full max-w-sm sm:mt-7">
          <SignInForm />
        </div>

        {/* Said plainly and up front, not only in the terms. */}
        <p className="mx-auto mt-5 max-w-sm text-[10.5px] leading-snug text-balance text-muted-dim">
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
