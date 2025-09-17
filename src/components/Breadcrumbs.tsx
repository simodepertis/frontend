"use client";

import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-4 text-sm text-neutral-500" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx > 0 && <span className="text-neutral-400">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-red-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-neutral-700 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
