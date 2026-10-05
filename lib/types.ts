import type { Database } from "@/lib/database.types";

export type { Database, Json } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

type RawCard = Database["public"]["CompositeTypes"]["profile_card"];

/**
 * The one shape every profile card renders from. Postgres composite columns all
 * come back nullable, but `cards_for` only ever emits rows joined to a real
 * profile, so this narrows them once at the boundary.
 */
export type ProfileCard = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  company: string | null;
  city: string | null;
  linkedin_url: string | null;
  hoping_to_get: string | null;
  is_here: boolean;
  interest_count: number;
  i_am_interested: boolean;
  they_are_interested: boolean;
  match_id: string | null;
  match_active: boolean;
};

export function toCard(row: RawCard): ProfileCard {
  return {
    id: row.id!,
    full_name: row.full_name ?? "Config attendee",
    avatar_url: row.avatar_url,
    headline: row.headline,
    company: row.company,
    city: row.city,
    linkedin_url: row.linkedin_url,
    hoping_to_get: row.hoping_to_get,
    is_here: row.is_here ?? false,
    interest_count: row.interest_count ?? 0,
    i_am_interested: row.i_am_interested ?? false,
    they_are_interested: row.they_are_interested ?? false,
    match_id: row.match_id,
    match_active: row.match_active ?? false,
  };
}

export function toCards(rows: RawCard[] | null): ProfileCard[] {
  return (rows ?? []).filter((r) => r.id).map(toCard);
}

/** A card is chat-ready only when the interest runs both ways and nobody has undone it. */
export function isMutual(card: Pick<ProfileCard, "match_id" | "match_active">) {
  return Boolean(card.match_id && card.match_active);
}

type RawNotification = Database["public"]["CompositeTypes"]["notification_item"];

export type AppNotification = {
  kind: "requested" | "accepted" | "connected";
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
  actorHeadline: string | null;
  matchId: string | null;
  happenedAt: string;
  isNew: boolean;
};

export function toNotifications(rows: RawNotification[] | null): AppNotification[] {
  return (rows ?? [])
    .filter((r) => r.actor_id && r.happened_at)
    .map((r) => ({
      kind:
        r.kind === "accepted"
          ? ("accepted" as const)
          : r.kind === "connected"
            ? ("connected" as const)
            : ("requested" as const),
      actorId: r.actor_id!,
      actorName: r.actor_name ?? "Config attendee",
      actorAvatar: r.actor_avatar,
      actorHeadline: r.actor_headline,
      matchId: r.match_id,
      happenedAt: r.happened_at!,
      isNew: r.is_new ?? false,
    }));
}

/**
 * Where a connection stands, from the viewer's side. Derived entirely from the
 * card: no status column exists, because a decline is a private `dismissals`
 * row that the sender is never shown. An invite they declined therefore stays
 * "pending" for the sender, which is deliberate.
 */
export type ConnectionStatus = "accepted" | "pending" | "invited_you" | "none";

export function connectionStatus(card: ProfileCard): ConnectionStatus {
  if (card.match_id && card.match_active) return "accepted";
  if (card.i_am_interested) return "pending";
  if (card.they_are_interested) return "invited_you";
  return "none";
}

export const STATUS_LABEL: Record<Exclude<ConnectionStatus, "none">, string> = {
  accepted: "Accepted",
  pending: "Pending",
  invited_you: "Invited you",
};
