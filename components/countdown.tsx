"use client";

import { useSyncExternalStore } from "react";

import { EVENT } from "@/lib/event";

const TARGET = Date.parse(EVENT.startsAt);

/**
 * Bucketed to the minute. The slim header shows no seconds, so a per-second
 * snapshot would re-render once a second to paint identical text.
 */
const getSnapshot = () => Math.floor(Date.now() / 60_000);

/**
 * 0 means "the clock has not started yet". The landing page is statically
 * prerendered, so returning a real timestamp here would bake build time into
 * the HTML and mismatch on hydration. The placeholder holds the same width.
 */
const getServerSnapshot = () => 0;

function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 10_000);
  return () => window.clearInterval(id);
}

function split(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  return [
    { value: Math.floor(total / 86_400), unit: "d", long: "days" },
    { value: Math.floor((total % 86_400) / 3_600), unit: "h", long: "hours" },
    { value: Math.floor((total % 3_600) / 60), unit: "m", long: "minutes" },
  ];
}

const PLACEHOLDER = [
  { value: null, unit: "d", long: "days" },
  { value: null, unit: "h", long: "hours" },
  { value: null, unit: "m", long: "minutes" },
];

/** Slim, header-sized. Deliberately quiet: the headline is the focal point. */
export function Countdown({ className = "" }: { className?: string }) {
  const nowMinutes = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ticking = nowMinutes !== 0;
  const msLeft = TARGET - nowMinutes * 60_000;

  if (ticking && msLeft <= 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-mutual ${className}`}
      >
        <span className="size-1.5 rounded-full bg-mutual" aria-hidden />
        Happening now
      </span>
    );
  }

  const units = ticking ? split(msLeft) : PLACEHOLDER;
  const label = ticking
    ? `${units.map((u) => `${u.value} ${u.long}`).join(", ")} until doors open on ${EVENT.dateLabel}`
    : `Counting down to ${EVENT.dateLabel}`;

  return (
    <span
      className={`inline-flex items-baseline gap-1.5 tabular-nums ${className}`}
      title={`Doors open ${EVENT.dateLabel}`}
      aria-label={label}
    >
      {units.map((unit) => (
        <span key={unit.unit} aria-hidden>
          <span className="text-[12px] font-semibold text-paper">
            {unit.value === null
              ? "––"
              : unit.unit === "d"
                ? unit.value
                : String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[10.5px] text-muted-dim">{unit.unit}</span>
        </span>
      ))}
    </span>
  );
}
