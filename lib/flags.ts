/** Server-only. The "I'm here" affordance stays hidden until the day of the event. */
export const eventDayEnabled = process.env.EVENT_DAY_ENABLED === "true";

export const appUrl =
  process.env.APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
