"use client";

import React from "react";

export default function Watermark({
  text = "incontriescort.org",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={
        // banda centrale molto visibile per coprire watermark esistenti
        "pointer-events-none select-none absolute inset-0 flex items-center justify-center " +
        (className ? className : "")
      }
      aria-hidden
    >
      {/* Barra scura spessa per coprire la scritta di bakecaincontri al centro */}
      <div className="w-full max-w-[1000px] px-8 py-6 bg-black/80">
        <span
          className="uppercase tracking-[0.35em] font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap text-sm sm:text-base md:text-lg"
          style={{
            // leggera sfocatura per effetto watermark
            filter: "blur(0.15px)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
