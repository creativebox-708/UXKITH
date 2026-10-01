"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Tone = "neutral" | "good" | "bad";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>");
  return toast;
}

const TONE_RING: Record<Tone, string> = {
  neutral: "border-line bg-surface-hi",
  good: "border-mutual/35 bg-mutual/12",
  bad: "border-accent/45 bg-accent/12",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, tone: Tone = "neutral") => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--footer-h)+14px)] z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-toast max-w-[min(92vw,26rem)] rounded-full border px-4 py-2 text-[13px] font-medium text-paper shadow-[0_12px_32px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl ${TONE_RING[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
