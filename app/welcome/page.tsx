import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Wordmark } from "@/components/wordmark";
import { getViewer } from "@/lib/auth";

import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ listed?: string; edit?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");

  const { profile } = viewer;
  const { edit } = await searchParams;
  const answeredNo = Boolean(profile.onboarded_at) && !profile.has_invite;

  if (profile.onboarded_at && profile.has_invite) redirect("/home");

  if (answeredNo && edit !== "1") {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-6 pt-10 pb-[calc(var(--footer-h)+2rem)]">
        <div className="animate-rise">
          <h1 className="font-display text-[1.75rem] leading-tight text-paper">
            This one&rsquo;s just for Config invitees.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Thanks for being straight with us. You&rsquo;re not listed, and nobody can find you
            here. Nothing about you is shared with anyone.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            If you do end up with an invite, come back and we&rsquo;ll get you in.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/welcome?edit=1"
              className="flex h-11 items-center justify-center rounded-xl border border-line-soft bg-surface/60 text-[14px] font-medium text-muted transition-colors hover:border-line hover:text-paper"
            >
              I answered that by mistake
            </Link>
            <Link
              href="/settings"
              className="text-center text-[13px] text-muted-dim underline-offset-2 hover:text-muted hover:underline"
            >
              Sign out or delete my data
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-10 pb-[calc(var(--footer-h)+2.5rem)]">
      <header className="animate-rise mb-7">
        <Wordmark className="mb-5" muted />
        <h1 className="font-display text-[1.75rem] leading-tight text-paper">
          One question, then you&rsquo;re in.
        </h1>
      </header>

      <WelcomeForm profile={profile} />
    </main>
  );
}
