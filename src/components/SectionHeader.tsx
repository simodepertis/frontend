"use client";

import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function SectionHeader({ title, subtitle, icon }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 grid place-items-center shadow-sm border border-red-100">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
