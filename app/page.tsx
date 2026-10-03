import { Countdown } from "@/components/countdown";
import { FlickeringGrid } from "@/components/flickering-grid";
import { EVENT } from "@/lib/event";

import { SignInForm } from "./sign-in-form";

export default function LandingPage() {
  return (
    <main className="relative flex h-[100svh] flex-col overflow-hidden px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(var(--footer-h)+1rem)] sm:px-8">
      {/* Fills the empty upper third and fades out well before the headline, so
          nothing has to be read through it. */}
      <div className="pointer-events-none absolute inset-0 -z-10 [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_22%,transparent_58%)] [mask-image:linear-gradient(to_bottom,black_0%,black_22%,transparent_58%)]">
        <FlickeringGrid color="#ff5c38" maxOpacity={0.22} flickerChance={0.22} />
      </div>

      <header className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-accent" aria-hidden />
        <span className="text-[13px] font-semibold tracking-[0.14em] text-paper">EVENTBUDDY</span>
      </header>

      <div className="mx-auto mt-auto w-full max-w-xl pt-6">
        <Countdown />

        {/* Said plainly and up front, not only in the terms. */}
        <p className="mt-2 px-0.5 text-[10.5px] leading-snug text-muted-dim">
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

      <div className="animate-rise mx-auto mt-7 w-full max-w-xl">
        <h1 className="font-display text-[clamp(1.625rem,7.6vw,2rem)] leading-[1.12] tracking-[-0.015em] text-pretty text-paper sm:text-[2.5rem] sm:leading-[1.08]">
          India&rsquo;s first Config. One day. Don&rsquo;t spend it walking past the people you came
          to meet.
        </h1>
        <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted sm:text-base">
          Find the ones you came to meet, before the doors open.
        </p>
      </div>

      <div className="mx-auto mt-7 w-full max-w-xl sm:mt-9">
        <SignInForm />
      </div>
    </main>
  );
}
