"use client";

import React from "react";

export default function Watermark({
  text = "incontriescort.org",
  className = "",
  variant = "default",
}: {
  text?: string;
  className?: string;
  variant?: "default" | "cover";
}) {
  if (variant === "cover") {
    // Stile grande per coprire filigrane esterne
    return (
      <div
        className={
          "pointer-events-none select-none absolute inset-0 flex items-center justify-center " +
          (className || "")
        }
        aria-hidden
      >
        <div className="text-center">
          <h2
            className="font-black uppercase text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl tracking-wider"
            style={{
              textShadow:
                "0 0 5px rgba(0,0,0,0.7), 0 0 10px rgba(0,0,0,0.7), 0 0 15px rgba(0,0,0,0.7)",
            }}
          >
            {text}
          </h2>
        </div>
      </div>
    );
  }

  // Stile piccolo di default
  return (
    <div
      className={
        "pointer-events-none select-none absolute inset-0 flex items-center justify-center " +
        (className || "")
      }
      aria-hidden
    >
      <div className="px-3 py-1 rounded-md bg-black/15">
        <span
          className="uppercase tracking-[0.35em] font-semibold text-white/65 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap"
          style={{
            filter: "blur(0.15px)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
