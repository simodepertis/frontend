"use client";

import Link from "next/link";

export default function Logo({ className = "w-[260px]" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Incontriescort.org" className={`inline-block ${className}`}>
      <svg viewBox="0 0 800 210" role="img" aria-labelledby="logoTitle logoDesc" xmlns="http://www.w3.org/2000/svg">
        <title id="logoTitle">INCONTRIESCORT.ORG</title>
        <desc id="logoDesc">Logo con scritta incontRIESCORT.org e sottotitolo Incontri Erotici</desc>
        <defs>
          <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f7e27c"/>
            <stop offset="45%" stopColor="#e1b64b"/>
            <stop offset="100%" stopColor="#c9922f"/>
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Left mark (simple abstract shape to echo reference) */}
        <g filter="url(#softShadow)">
          <path d="M80 20 L110 20 L70 140 L40 140 Z" fill="url(#gold)" />
          <path d="M110 20 L140 20 L120 140 L90 140 Z" fill="#b88122" opacity="0.85" />
        </g>

        {/* Main text */}
        <g fontFamily="inherit" fontWeight="700" letterSpacing="1.5">
          <text x="165" y="105" fontSize="86" fill="url(#gold)">INCONTRI</text>
          <text x="585" y="105" fontSize="86" fill="#e6e6e6">ESCORT</text>
          <text x="775" y="105" fontSize="60" fill="#e6e6e6">.ORG</text>
        </g>

        {/* Subtitle */}
        <text x="165" y="165" fontSize="26" letterSpacing="8" fill="#bfc6d1">INCONTRI EROTICI</text>
      </svg>
    </Link>
  );
}
