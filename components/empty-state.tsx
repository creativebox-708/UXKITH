export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji?: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-fade flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/30 px-6 py-10 text-center">
      {emoji && (
        <span className="mb-3 text-2xl" aria-hidden>
          {emoji}
        </span>
      )}
      <p className="text-[15px] font-semibold text-paper">{title}</p>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
