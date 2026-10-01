import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Avatar } from "@/components/avatar";
import { BackMark } from "@/components/icons";
import { getViewer } from "@/lib/auth";

import { DangerZone, ProfileForm } from "./settings-client";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const { profile } = viewer;

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-5 pb-[calc(var(--footer-h)+2.5rem)]">
      <Link
        href={profile.has_invite ? "/home" : "/welcome"}
        className="mb-6 -ml-1.5 inline-flex items-center gap-1.5 rounded-lg p-1.5 text-[13px] text-muted transition-colors hover:text-paper"
      >
        <BackMark className="size-3.5" />
        Back
      </Link>

      <div className="mb-7 flex items-center gap-3">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={48} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl leading-tight text-paper">
            {profile.full_name}
          </h1>
          <p className="text-[12.5px] text-muted-dim">
            {profile.has_invite ? "Listed at Config India 2026" : "Not listed"}
          </p>
        </div>
      </div>

      {profile.has_invite && (
        <section className="mb-8">
          <h2 className="mb-3 text-[12px] font-semibold tracking-[0.1em] text-muted-dim uppercase">
            Your card
          </h2>
          <ProfileForm profile={profile} />
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-[12px] font-semibold tracking-[0.1em] text-muted-dim uppercase">
          Account
        </h2>
        <div className="flex flex-col gap-2.5">
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="h-11 w-full rounded-xl border border-line-soft bg-surface/60 text-[14px] font-medium text-paper transition-colors hover:border-line hover:bg-surface"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/terms"
            className="flex h-11 items-center justify-center rounded-xl border border-line-soft bg-surface/60 text-[14px] font-medium text-muted transition-colors hover:border-line hover:text-paper"
          >
            Terms and privacy note
          </Link>
        </div>
      </section>

      <section>
        <DangerZone />
      </section>
    </main>
  );
}
