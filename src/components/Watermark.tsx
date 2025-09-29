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
        "pointer-events-none select-none absolute inset-0 flex items-center justify-center" +
        (className ? " " + className : "")
      }
      aria-hidden
    >
      {/* Fondo scuro leggerissimo per migliorare il contrasto, molto trasparente */}
      <div className="px-3 py-1 rounded-md bg-black/5">
        <span
          className="uppercase tracking-[0.35em] font-semibold text-white/35 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap"
          style={{
            // leggera sfocatura per effetto watermark
            filter: "blur(0.2px)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
