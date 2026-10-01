"use client";

import { useActionState, useState } from "react";

import { Avatar } from "@/components/avatar";
import { SpinnerMark } from "@/components/icons";
import { completeWelcome } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

const FIELD =
  "w-full rounded-xl border border-line-soft bg-surface/70 px-3.5 py-2.5 text-[15px] text-paper placeholder:text-muted-dim transition-colors focus:border-line focus:outline-none";

const LABEL = "mb-1.5 block text-[12px] font-medium tracking-wide text-muted";

export function WelcomeForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(completeWelcome, {});
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [hoping, setHoping] = useState(profile.hoping_to_get ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex items-center gap-3 rounded-2xl border border-line-soft bg-surface/50 p-3">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={44} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-paper">{profile.full_name}</p>
          <p className="text-[12px] text-muted-dim">From your LinkedIn. No phone number, ever.</p>
        </div>
      </div>

      <fieldset>
        <legend className="mb-3 text-[15px] font-medium text-paper">
          Did you receive a Config India 2026 invite?
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {(["yes", "no"] as const).map((value) => (
            <div key={value} className="contents">
              <input
                type="radio"
                id={`invite-${value}`}
                name="has_invite"
                value={value}
                className="sr-only"
                checked={answer === value}
                onChange={() => setAnswer(value)}
              />
              <label
                htmlFor={`invite-${value}`}
                className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border text-[14px] font-semibold capitalize transition-all duration-200 ${
                  answer === value
                    ? "border-accent bg-accent/12 text-accent-hi"
                    : "border-line-soft bg-surface/60 text-muted hover:border-line hover:text-paper"
                }`}
              >
                {value}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      {answer === "yes" && (
        <div className="animate-rise flex flex-col gap-4">
          <p className="text-[12.5px] leading-relaxed text-muted-dim">
            LinkedIn doesn&rsquo;t hand these over, so add what you want people to see on your card.
          </p>

          <div>
            <label htmlFor="headline" className={LABEL}>
              What you do
            </label>
            <input
              id="headline"
              name="headline"
              defaultValue={profile.headline ?? ""}
              maxLength={120}
              placeholder="Product Designer"
              className={FIELD}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="company" className={LABEL}>
                Company
              </label>
              <input
                id="company"
                name="company"
                defaultValue={profile.company ?? ""}
                maxLength={80}
                placeholder="Freelance"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="city" className={LABEL}>
                City
              </label>
              <input
                id="city"
                name="city"
                defaultValue={profile.city ?? ""}
                maxLength={60}
                placeholder="Bangalore"
                className={FIELD}
              />
            </div>
          </div>

          <div>
            <label htmlFor="linkedin_url" className={LABEL}>
              LinkedIn profile <span className="text-muted-dim">(optional)</span>
            </label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              inputMode="url"
              defaultValue={profile.linkedin_url ?? ""}
              placeholder="linkedin.com/in/you"
              className={FIELD}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="hoping_to_get" className={LABEL}>
                What I&rsquo;m hoping to get out of Config{" "}
                <span className="text-muted-dim">(optional)</span>
              </label>
              <span
                className={`mb-1.5 text-[11px] tabular-nums ${hoping.length > 110 ? "text-accent-hi" : "text-muted-dim"}`}
              >
                {hoping.length}/120
              </span>
            </div>
            <input
              id="hoping_to_get"
              name="hoping_to_get"
              value={hoping}
              onChange={(event) => setHoping(event.target.value.slice(0, 120))}
              maxLength={120}
              placeholder="Meet people building design systems in India"
              className={FIELD}
            />
          </div>
        </div>
      )}

      {state.error && <p className="text-[13px] text-accent-hi">{state.error}</p>}

      <button
        type="submit"
        disabled={!answer || pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-paper text-[15px] font-semibold text-ink transition-all duration-200 enabled:hover:-translate-y-px enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted-dim"
      >
        {pending && <SpinnerMark className="size-4" />}
        {answer === "no" ? "Submit" : "Start finding people"}
      </button>
    </form>
  );
}
