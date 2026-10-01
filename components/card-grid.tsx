import { ProfileCard, ProfileCardSkeleton } from "@/components/profile-card";
import type { ProfileCard as Card } from "@/lib/types";

export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={card.id}
          className="animate-rise"
          style={{ animationDelay: `${Math.min(i, 11) * 32}ms` }}
        >
          <ProfileCard card={card} />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProfileCardSkeleton key={i} />
      ))}
    </div>
  );
}
