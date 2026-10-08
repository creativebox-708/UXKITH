import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Wordmark } from "@/components/wordmark";
import { getViewer } from "@/lib/auth";

import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");

  const { profile } = viewer;
  const { edit } = await searchParams;

  // Asked once. Either answer gets you in; it only decides whether your card
  // carries the invite badge, so there is nothing to hold anyone up here.
  if (profile.onboarded_at && edit !== "1") redirect("/home");

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-10 pb-[calc(var(--footer-h)+2.5rem)]">
      <header className="animate-rise mb-7">
        <Wordmark className="mb-5" muted />
        <h1 className="font-display text-[1.75rem] leading-tight text-paper">
          Nearly in. Tell us who you are.
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
          You&rsquo;re on the list either way. Saying you have an invite just adds a badge to
          your card.
        </p>
      </header>

      <WelcomeForm profile={profile} />
    </main>
  );
}
