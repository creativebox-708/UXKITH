import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { LinkedInMark } from "@/components/icons";
import { HereDot } from "@/components/profile-card";
import type { Profile } from "@/lib/types";

export type MyStats = {
  inbound: number;
  outgoing: number;
  connections: number;
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[14px] font-semibold tabular-nums text-paper">{value}</span>
      <span className="text-[11.5px] text-muted-dim">{label}</span>
    </span>
  );
}

/**
 * You, as everyone else sees you. Deliberately not a ProfileCard: there is no
 * "Interested to meet" on your own face, and the counters here are yours only.
 */
export function MyCard({ profile, stats }: { profile: Profile; stats: MyStats }) {
  const missing = [
    !profile.headline && "what you do",
    !profile.city && "your city",
    !profile.linkedin_url && "your LinkedIn",
  ].filter((value): value is string => Boolean(value));

  const detail = [profile.company, profile.city].filter(Boolean).join(" · ");

  return (
    <section
      aria-label="Your card"
      className="animate-rise rounded-2xl border border-line-soft bg-surface/50 p-4"
    >
      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          <Avatar name={profile.full_name} src={profile.avatar_url} size={48} />
          {profile.is_here && <HereDot className="absolute -right-0.5 -bottom-0.5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[9.5px] font-semibold tracking-[0.14em] text-muted-dim uppercase">
            You&rsquo;re on the list
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-[15px] leading-tight font-semibold tracking-[-0.01em] text-paper">
            <span className="truncate">{profile.full_name}</span>
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Your LinkedIn profile"
                className="-m-1.5 shrink-0 p-1.5 text-muted-dim transition-colors hover:text-[#0a66c2]"
              >
                <LinkedInMark className="size-[13px]" />
              </a>
            )}
          </h2>
          {profile.headline && (
            <p className="mt-0.5 text-[12px] leading-snug text-muted clamp-2">{profile.headline}</p>
          )}
          {detail && <p className="mt-0.5 truncate text-[11.5px] text-muted-dim">{detail}</p>}
        </div>

        <Link
          href="/settings"
          className="hidden h-8 shrink-0 items-center rounded-xl border border-line-soft px-3 text-[12px] font-medium text-muted transition-colors hover:border-line hover:text-paper sm:flex"
        >
          Edit
        </Link>
      </div>

      {profile.hoping_to_get && (
        <p className="mt-3 border-l border-line pl-2.5 text-[11.5px] leading-snug text-muted/90">
          {profile.hoping_to_get}
        </p>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line-soft pt-3">
        <Stat value={stats.inbound} label="waiting on you" />
        <Stat value={stats.outgoing} label="invites sent" />
        <Stat
          value={stats.connections}
          label={stats.connections === 1 ? "connection" : "connections"}
        />
      </div>

      {/* A card with gaps gets tapped less, so name the gaps rather than
          leaving them to be noticed. */}
      {missing.length > 0 && (
        <p className="mt-3 text-[11.5px] leading-snug text-muted">
          Add{" "}
          {missing.length === 1
            ? missing[0]
            : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`}{" "}
          so people recognise you.{" "}
          <Link
            href="/settings"
            className="font-medium text-paper underline decoration-line underline-offset-2 transition-colors hover:decoration-accent"
          >
            Finish your card
          </Link>
        </p>
      )}

      <Link
        href="/settings"
        className="mt-3 flex h-9 items-center justify-center rounded-xl border border-line-soft text-[12.5px] font-medium text-muted transition-colors hover:border-line hover:text-paper sm:hidden"
      >
        Edit your card
      </Link>
    </section>
  );
}
