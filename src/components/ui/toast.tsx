"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  durationMs?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  show: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const duration = t.durationMs ?? 4000;
    setToasts((prev) => [...prev, { ...t, id }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const value = useMemo(() => ({ toasts, show, dismiss }), [toasts, show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="fixed z-[100] bottom-4 right-4 flex flex-col gap-2 w-[min(92vw,380px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "rounded-lg border p-3 shadow-md animate-in fade-in slide-in-from-bottom-2",
              t.variant === "success" ? "bg-green-600 text-white border-green-500" :
              t.variant === "error" ? "bg-red-600 text-white border-red-500" :
              t.variant === "warning" ? "bg-amber-500 text-black border-amber-400" :
              "bg-neutral-900 text-white border-neutral-700",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            {t.title && <div className="font-semibold text-sm">{t.title}</div>}
            {t.description && <div className="text-xs opacity-90 mt-0.5">{t.description}</div>}
            <button
              className="absolute top-2 right-2 text-xs opacity-80 hover:opacity-100"
              onClick={() => dismiss(t.id)}
              aria-label="Chiudi notifica"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
