"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function Dropdown({ label, children, className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded bg-white font-semibold shadow hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className={cn("absolute left-0 mt-2 z-20 bg-white border border-neutral-200 rounded shadow-lg", className)}>
          {children}
        </div>
      )}
    </div>
  );
}
