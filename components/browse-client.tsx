"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CloseMark, SearchMark, SpinnerMark } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { ProfileCard, ProfileCardSkeleton } from "@/components/profile-card";
import { createClient } from "@/lib/supabase/client";
import { toCards, type ProfileCard as Card } from "@/lib/types";

const PAGE = 24;

/** Matched against the headline, which is the closest thing to a role we store. */
const ROLES = [
  "Product Designer",
  "UX",
  "UI",
  "Design Lead",
  "Design Manager",
  "Researcher",
  "Brand",
  "Motion",
  "Engineer",
  "Founder",
  "Student",
];

type Filters = { search: string; role: string; city: string; company: string };

const EMPTY: Filters = { search: "", role: "", city: "", company: "" };

function Chip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const active = value !== "";
  return (
    <div
      className={`relative flex h-8 shrink-0 items-center rounded-full border pr-2 pl-3 text-[12.5px] transition-colors ${
        active
          ? "border-accent/45 bg-accent/12 text-accent-hi"
          : "border-line-soft bg-surface/60 text-muted"
      }`}
    >
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="cursor-pointer appearance-none bg-transparent pr-4 text-[12.5px] font-medium outline-none"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-ink-soft text-paper">
            {option}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-[9px] opacity-70">
        &#9660;
      </span>
    </div>
  );
}

export function BrowseClient({
  initialCards,
  cities,
  companies,
}: {
  initialCards: Card[];
  cities: string[];
  companies: string[];
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [draft, setDraft] = useState("");
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialCards.length < PAGE);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);


  const fetchPage = useCallback(async (offset: number, current: Filters) => {
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("browse_profiles", {
      p_search: current.search || undefined,
      p_role: current.role || undefined,
      p_city: current.city || undefined,
      p_company: current.company || undefined,
      p_limit: PAGE,
      p_offset: offset,
    });

    // A slower earlier request must never overwrite a newer one.
    if (id !== requestId.current) return;

    if (error) {
      setFailed(true);
      setLoading(false);
      return;
    }

    const page = toCards(data);
    setCards((existing) => (offset === 0 ? page : [...existing, ...page]));
    setDone(page.length < PAGE);
    setLoading(false);
  }, []);

  // Changing a filter is what triggers a reload, not a render. Page one for the
  // untouched filters was already rendered on the server, so nothing fetches
  // until something here actually changes.
  const applyFilters = useCallback(
    (next: Filters) => {
      setFilters(next);
      void fetchPage(0, next);
    },
    [fetchPage],
  );

  // Debounce the name search so a fast typist does not fire a query per keystroke.
  useEffect(() => {
    if (draft === filters.search) return;
    const id = window.setTimeout(() => applyFilters({ ...filters, search: draft }), 260);
    return () => window.clearTimeout(id);
  }, [draft, filters, applyFilters]);

  const pristine =
    filters.search === "" && filters.role === "" && filters.city === "" && filters.company === "";

  useEffect(() => {
    const node = sentinel.current;
    if (!node || done || loading || failed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchPage(cards.length, filters);
      },
      { rootMargin: "320px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cards.length, done, loading, failed, filters, fetchPage]);

  function clearAll() {
    setDraft("");
    applyFilters(EMPTY);
  }

  const anyFilter = !pristine;

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 bg-ink/85 px-4 pt-4 pb-3 backdrop-blur-xl">
        <div className="relative">
          <SearchMark className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-dim" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search by name"
            aria-label="Search designers by name"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-line-soft bg-surface/70 pr-10 pl-10 text-[15px] text-paper placeholder:text-muted-dim focus:border-line focus:outline-none"
          />
          {draft && (
            <button
              type="button"
              onClick={() => setDraft("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted-dim hover:text-paper"
            >
              <CloseMark className="size-3.5" />
            </button>
          )}
        </div>

        <div className="no-scrollbar mt-2.5 flex items-center gap-2 overflow-x-auto">
          <Chip
            label="Role"
            value={filters.role}
            options={ROLES}
            onChange={(role) => applyFilters({ ...filters, role })}
          />
          <Chip
            label="City"
            value={filters.city}
            options={cities}
            onChange={(city) => applyFilters({ ...filters, city })}
          />
          <Chip
            label="Company"
            value={filters.company}
            options={companies}
            onChange={(company) => applyFilters({ ...filters, company })}
          />
          {anyFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="h-8 shrink-0 rounded-full px-2.5 text-[12px] text-muted-dim transition-colors hover:text-paper"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {failed ? (
        <EmptyState
          title="That didn't load"
          body="The connection dropped on the way. Try once more."
          action={
            <button
              type="button"
              onClick={() => void fetchPage(0, filters)}
              className="flex h-9 items-center gap-2 rounded-xl border border-line px-4 text-[13px] font-medium text-paper transition-colors hover:bg-surface"
            >
              <SpinnerMark className="size-3.5" />
              Retry
            </button>
          }
        />
      ) : cards.length === 0 && !loading ? (
        <EmptyState
          emoji="&#128269;"
          title={anyFilter ? "Nobody matches that yet" : "No designers listed yet"}
          body={
            anyFilter
              ? "Try a shorter name, or drop one of the filters. Not everyone fills in their company and city."
              : "Invitees are still signing in. Check back shortly."
          }
          action={
            anyFilter ? (
              <button
                type="button"
                onClick={clearAll}
                className="flex h-9 items-center rounded-xl border border-line px-4 text-[13px] font-medium text-paper transition-colors hover:bg-surface"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/home"
                className="flex h-9 items-center rounded-xl border border-line px-4 text-[13px] font-medium text-paper transition-colors hover:bg-surface"
              >
                Back to home
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => (
            <ProfileCard key={card.id} card={card} />
          ))}
          {loading &&
            Array.from({ length: cards.length === 0 ? 8 : 4 }, (_, i) => (
              <ProfileCardSkeleton key={`sk-${i}`} />
            ))}
        </div>
      )}

      <div ref={sentinel} aria-hidden className="h-px" />

      {done && cards.length > 0 && (
        <p className="pt-6 text-center text-[12px] text-muted-dim">
          That&rsquo;s everyone{anyFilter ? " matching that" : ""}.
        </p>
      )}
    </>
  );
}
