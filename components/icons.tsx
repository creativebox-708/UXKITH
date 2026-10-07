type IconProps = { className?: string };

export function LinkedInMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function CheckMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.4 6.3 11.7 13 5" />
    </svg>
  );
}

export function ChatMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.8 7.6c0 2.9-2.6 5.3-5.8 5.3-.78 0-1.52-.14-2.2-.4l-3.3 1 1.07-2.78A5.08 5.08 0 0 1 2.2 7.6c0-2.93 2.6-5.3 5.8-5.3s5.8 2.37 5.8 5.3Z" />
    </svg>
  );
}

export function SearchMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <circle cx="7.2" cy="7.2" r="4.4" />
      <path d="m10.6 10.6 2.8 2.8" />
    </svg>
  );
}

export function CloseMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="m4.2 4.2 7.6 7.6M11.8 4.2l-7.6 7.6" />
    </svg>
  );
}

export function BackMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.6 3.2 4.8 8l4.8 4.8" />
    </svg>
  );
}

export function SendMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2 7.3 8.7M14 2l-4.3 12-2.4-5.3L2 6.3 14 2Z" />
    </svg>
  );
}

export function DotsMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="currentColor">
      <circle cx="8" cy="3.2" r="1.45" />
      <circle cx="8" cy="8" r="1.45" />
      <circle cx="8" cy="12.8" r="1.45" />
    </svg>
  );
}

export function SpinnerMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={`animate-spin ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="8" cy="8" r="5.6" className="opacity-25" />
      <path d="M8 2.4A5.6 5.6 0 0 1 13.6 8" />
    </svg>
  );
}

export function TrophyMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.4h6.4v3.1a3.2 3.2 0 0 1-6.4 0V2.4Z" />
      <path d="M4.8 3.3H3.1v1a2 2 0 0 0 1.8 2M11.2 3.3h1.7v1a2 2 0 0 1-1.8 2" />
      <path d="M8 8.7v2.4M5.6 13.6h4.8l-.5-2.5H6.1l-.5 2.5Z" />
    </svg>
  );
}
