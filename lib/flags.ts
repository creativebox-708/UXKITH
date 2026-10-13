import { EVENT } from "@/lib/event";

/**
 * Server-only. The "I'm here" affordance stays hidden until the day itself.
 *
 * This used to be a module-level constant reading EVENT_DAY_ENABLED, which had
 * two ways to fail on the one morning it mattered: a constant is evaluated when
 * the module loads, so a long-lived instance that booted yesterday keeps
 * yesterday's answer; and Next inlines process.env at build time, so setting the
 * variable in Vercel does nothing without a redeploy. Both duly happened.
 *
 * It is a function now, and it turns itself on when the date arrives. The env
 * variable still forces it on early, for testing before the day.
 */

/** Bengaluru time, because that is where the event and everyone at it is. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istDate(at: number) {
  return new Date(at + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isEventDay(now = Date.now()) {
  return istDate(now) === istDate(Date.parse(EVENT.startsAt));
}

export function eventDayEnabled(now = Date.now()) {
  return process.env.EVENT_DAY_ENABLED === "true" || isEventDay(now);
}

export const appUrl =
  process.env.APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
