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
          <div className="w-9 h-9 rounded-full bg-blue-900 text-blue-400 grid place-items-center shadow-sm border border-blue-800">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
