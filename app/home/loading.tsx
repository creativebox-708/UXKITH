import { CardGridSkeleton } from "@/components/card-grid";

export default function HomeLoading() {
  return (
    <>
      <div className="sticky top-0 z-30 h-14 border-b border-line-soft bg-ink/80 backdrop-blur-xl" />
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-[calc(var(--footer-h)+2.5rem)]">
        <div className="skeleton h-7 w-2/3 max-w-xs rounded" />
        <div className="skeleton mt-3 h-3 w-1/2 max-w-[18rem] rounded" />
        <div className="mt-5">
          <CardGridSkeleton count={8} />
        </div>
      </main>
    </>
  );
}
