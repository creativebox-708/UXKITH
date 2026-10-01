import { builders } from "@/lib/builders";

export function Footer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 h-(--footer-h) border-t border-line-soft bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-center gap-1 px-4 text-[11px] text-muted-dim">
        <span>Built by</span>
        {builders.map((person, i) => (
          <span key={person.name} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>&amp;</span>}
            <a
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted underline-offset-2 transition-colors hover:text-paper hover:underline"
            >
              {person.name}
            </a>
          </span>
        ))}
      </div>
    </footer>
  );
}
