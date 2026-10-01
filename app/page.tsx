import { SignInForm } from "./sign-in-form";

export default function LandingPage() {
  return (
    <main className="flex h-[100svh] flex-col overflow-hidden px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(var(--footer-h)+1.25rem)] sm:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent" aria-hidden />
          <span className="text-[13px] font-semibold tracking-[0.14em] text-paper">EVENTBUDDY</span>
        </div>
        <span className="rounded-full border border-line-soft bg-surface/70 px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-muted">
          CONFIG INDIA · 15 OCT
        </span>
      </header>

      <div className="animate-rise mx-auto mt-auto w-full max-w-xl">
        <h1 className="font-display text-[clamp(1.75rem,8.4vw,2.125rem)] leading-[1.12] tracking-[-0.015em] text-pretty text-paper sm:text-[2.75rem] sm:leading-[1.08]">
          India&rsquo;s first Config. One day. Don&rsquo;t spend it walking past the people you came
          to meet.
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted sm:text-base">
          Find the ones you came to meet, before the doors open.
        </p>
      </div>

      <div className="mx-auto mt-9 w-full max-w-xl sm:mt-11">
        <SignInForm />
      </div>
    </main>
  );
}
