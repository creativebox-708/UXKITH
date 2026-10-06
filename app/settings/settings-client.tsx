"use client";

import { useActionState, useState, useTransition } from "react";

import { SpinnerMark } from "@/components/icons";
import { useToast } from "@/components/toast";
import { deleteAccount } from "@/lib/actions/safety";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

const FIELD =
  "w-full rounded-xl border border-line-soft bg-surface/70 px-3.5 py-2.5 text-[15px] text-paper placeholder:text-muted-dim transition-colors focus:border-line focus:outline-none";

const LABEL = "mb-1.5 block text-[12px] font-medium tracking-wide text-muted";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, {});
  const [hoping, setHoping] = useState(profile.hoping_to_get ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="linkedin_url" className={LABEL}>
          LinkedIn profile
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          type="text"
          inputMode="url"
          required
          defaultValue={profile.linkedin_url ?? ""}
          placeholder="your-handle, or paste the full link"
          className={FIELD}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="hoping_to_get" className={LABEL}>
            What I&rsquo;m hoping to get out of Config
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
          className={FIELD}
        />
      </div>

      {state.error && <p className="text-[13px] text-accent-hi">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-paper px-5 text-[14px] font-semibold text-ink transition-all duration-200 enabled:active:scale-[0.99] disabled:opacity-60"
        >
          {pending && <SpinnerMark className="size-4" />}
          Save changes
        </button>
        {/* only after the server actually confirmed the write */}
        {state.savedAt && !pending && (
          <span key={state.savedAt} className="animate-fade text-[12.5px] text-mutual">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}

export function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const ready = typed.trim().toLowerCase() === "delete";

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
      <h3 className="text-[14px] font-semibold text-paper">Delete my account</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Removes your profile, everyone you tagged, everyone who tagged you, your matches and your
        messages. It cannot be undone.
      </p>

      {confirming ? (
        <div className="mt-4 flex flex-col gap-2.5">
          <label htmlFor="confirm-delete" className="text-[12.5px] text-muted">
            Type <span className="font-semibold text-paper">delete</span> to confirm.
          </label>
          <input
            id="confirm-delete"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            className="w-full rounded-xl border border-line-soft bg-surface/70 px-3.5 py-2.5 text-[15px] text-paper focus:border-line focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!ready || pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteAccount();
                  if (result?.error) toast(result.error, "bad");
                })
              }
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-[13.5px] font-semibold text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && <SpinnerMark className="size-4" />}
              Delete everything
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setTyped("");
              }}
              className="h-10 rounded-xl border border-line-soft px-4 text-[13.5px] font-medium text-muted hover:text-paper"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3.5 h-10 rounded-xl border border-accent/40 px-4 text-[13.5px] font-medium text-accent-hi transition-colors hover:bg-accent/10"
        >
          Delete my account
        </button>
      )}
    </div>
  );
}
