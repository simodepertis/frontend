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
        "pointer-events-none select-none absolute inset-0 flex items-center justify-center " +
        (className ? className : "")
      }
      aria-hidden
    >
      <div className="text-center">
        <h2
          className="font-black uppercase text-white text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wider"
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
