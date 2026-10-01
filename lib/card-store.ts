"use client";

import { useSyncExternalStore } from "react";

import type { ProfileCard } from "@/lib/types";

export type CardState = {
  interested: boolean;
  count: number;
  matchId: string | null;
  matchActive: boolean;
};

/**
 * The same person can be on screen twice — once in the suggested grid, once in
 * the my-list modal. Optimistic updates are kept here so every mounted card for
 * that person moves together instead of drifting apart.
 */
const overrides = new Map<string, CardState>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setCardState(id: string, state: CardState) {
  overrides.set(id, state);
  emit();
}

export function clearCardState(id: string) {
  if (overrides.delete(id)) emit();
}

export function fromCard(card: ProfileCard): CardState {
  return {
    interested: card.i_am_interested,
    count: card.interest_count,
    matchId: card.match_id,
    matchActive: card.match_active,
  };
}

export function useCardState(card: ProfileCard): CardState {
  const override = useSyncExternalStore(
    subscribe,
    () => overrides.get(card.id),
    () => undefined,
  );
  return override ?? fromCard(card);
}
