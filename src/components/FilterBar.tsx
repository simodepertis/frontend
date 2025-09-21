"use client";

import { ReactNode } from "react";

export default function FilterBar({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 p-6 bg-gray-900 rounded-lg shadow-md border border-gray-700">
      {title && (
        <h2 className="text-xl font-bold text-white mb-4 text-center">{title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {children}
        {actions}
      </div>
    </div>
  );
}
