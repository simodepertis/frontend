"use client";

import Link from "next/link";

export default function Logo({ className = "w-[260px]" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Incontriescort.org" className={`inline-block ${className}`}>
      <svg viewBox="0 0 980 210" role="img" aria-labelledby="logoTitle logoDesc" xmlns="http://www.w3.org/2000/svg">
        <title id="logoTitle">INCONTRIESCORT.ORG</title>
        <desc id="logoDesc">Logo con scritta incontRIESCORT.org e sottotitolo Incontri Erotici</desc>
        <defs>
          <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff1a3"/>
            <stop offset="35%" stopColor="#f0c968"/>
            <stop offset="70%" stopColor="#d9a53f"/>
            <stop offset="100%" stopColor="#b77820"/>
          </linearGradient>
          <linearGradient id="goldStroke" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8d57d"/>
            <stop offset="100%" stopColor="#a56b1b"/>
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Left mark refined */}
        <g filter="url(#softShadow)">
          <path d="M75 22 C95 20, 105 20, 120 22 L92 145 L60 145 Z" fill="url(#gold)" stroke="url(#goldStroke)" strokeWidth="2" />
          <path d="M118 22 L142 22 L120 145 L96 145 Z" fill="#a86f1e" opacity="0.9" />
        </g>

        {/* Main text */}
        <g fontFamily="serif" fontWeight="700" letterSpacing="1.5">
          {/* Tutto oro: INCONTRIESCORT */}
          <text x="165" y="105" fontSize="86" fill="url(#gold)" stroke="url(#goldStroke)" strokeWidth="0.8">INCONTRIESCORT</text>
          {/* Solo dominio in bianco - spostato molto più a destra */}
          <text x="900" y="105" fontSize="60" fill="#eaeaea">.ORG</text>
        </g>

        {/* Subtitle */}
        <text x="165" y="165" fontSize="26" letterSpacing="10" fill="#c8ced8">INCONTRI EROTICI</text>
      </svg>
    </Link>
  );
}
