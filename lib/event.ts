/**
 * Public, factual details of the event this app is built for. Facts like a date
 * and a venue carry no trademark, so stating them is safe; branding does, which
 * is why nothing here references a logo, a wordmark or any brand asset.
 */
export const EVENT = {
  /**
   * Doors-open time, IST. Figma has published the date but not the schedule, so
   * 09:00 is an assumption — update it once the agenda is out.
   */
  startsAt: "2026-10-15T09:00:00+05:30",
  dateLabel: "15 October 2026",
  city: "Bengaluru, India",
  venue: "BIEC, Tumkur Road",
  /** For tight one-line placements like the landing page. */
  venueShort: "BIEC, Bengaluru",
  format: "In person & virtual",
  /** The authoritative source. Linking out is what keeps us clearly separate from it. */
  officialUrl: "https://config.figma.com/india/",
} as const;
