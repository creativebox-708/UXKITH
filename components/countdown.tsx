"use client";

import { useSyncExternalStore } from "react";

import { EVENT } from "@/lib/event";

const TARGET = Date.parse(EVENT.startsAt);

function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(id);
}

/** Bucketed to the second, so the snapshot is stable within a tick. */
const getSnapshot = () => Math.floor(Date.now() / 1000);

/**
 * 0 means "the clock has not started yet". The landing page is statically
 * prerendered, so returning a real timestamp here would bake build time into
 * the HTML and mismatch on hydration. The placeholder holds the same space, so
 * the digits arrive without any layout shift.
 */
const getServerSnapshot = () => 0;

function split(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  return [
    { value: Math.floor(total / 86_400), label: "days" },
    { value: Math.floor((total % 86_400) / 3_600), label: "hrs" },
    { value: Math.floor((total % 3_600) / 60), label: "min" },
    { value: total % 60, label: "sec" },
  ];
}

const PLACEHOLDER = [
  { value: null, label: "days" },
  { value: null, label: "hrs" },
  { value: null, label: "min" },
  { value: null, label: "sec" },
];

export function Countdown() {
  const nowSeconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ticking = nowSeconds !== 0;
  const msLeft = TARGET - nowSeconds * 1000;
  const units = ticking ? split(msLeft) : PLACEHOLDER;
  const underway = ticking && msLeft <= 0;

  return (
    <div className="rounded-2xl border border-line-soft bg-surface/45 px-3.5 py-3">
      <p className="text-[9.5px] font-semibold tracking-[0.14em] text-muted-dim uppercase">
        {underway ? "Happening now" : "Doors open in"}
        <span className="text-muted"> · {EVENT.dateLabel}</span>
      </p>

      {underway ? (
        <p className="mt-1.5 font-display text-[1.375rem] leading-tight text-paper">
          Config India is on. Go find your people.
        </p>
      ) : (
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {units.map((unit) => (
            <div key={unit.label} className="text-center">
              <div className="font-display text-[1.75rem] leading-none tabular-nums text-paper">
                {unit.value === null
                  ? "––"
                  : unit.label === "days"
                    ? unit.value
                    : String(unit.value).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[9px] font-medium tracking-[0.1em] text-muted-dim uppercase">
                {unit.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2.5 border-t border-line-soft pt-2 text-[10.5px] leading-snug text-muted">
        {EVENT.venue} · {EVENT.city} · {EVENT.format}
      </p>
    </div>
  );
}
