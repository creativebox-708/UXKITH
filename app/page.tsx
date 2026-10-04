import { Countdown } from "@/components/countdown";
import { FlickeringGrid } from "@/components/flickering-grid";
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

      {/* Pinned out of the flow, so the column centres on the true viewport. */}
      <header className="absolute inset-x-6 top-[max(1.25rem,env(safe-area-inset-top))] flex items-center gap-2 sm:inset-x-8">
        <span className="size-2 rounded-full bg-accent" aria-hidden />
        <span className="text-[13px] font-semibold tracking-[0.14em] text-paper">EVENTBUDDY</span>
      </header>

      <div className="animate-rise w-full max-w-xl text-center">
        <Countdown />

        {/* Said plainly and up front, not only in the terms. */}
        <p className="mt-2.5 text-[10.5px] leading-snug text-muted-dim">
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

        <h1 className="mt-7 font-display text-[clamp(1.625rem,7.6vw,2rem)] leading-[1.12] tracking-[-0.015em] text-balance text-paper sm:mt-8 sm:text-[2.5rem] sm:leading-[1.08]">
          India&rsquo;s first Config. One day. Don&rsquo;t spend it walking past the people you came
          to meet.
        </h1>

        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-balance text-muted sm:text-base">
          Find the ones you came to meet, before the doors open.
        </p>

        <div className="mx-auto mt-7 w-full max-w-sm sm:mt-8">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
