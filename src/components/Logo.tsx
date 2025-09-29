"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Logo({ className = "w-[400px]" }: { className?: string }) {
  const [src, setSrc] = useState<string>("/logo.png");
  return (
    <Link href="/" aria-label="Incontriescort.org" className={`inline-block ${className}`}>
      <Image
        src={src}
        alt="INCONTRIESCORT - Incontri Erotici"
        width={1024}
        height={264}
        className="w-full h-auto"
        priority
        onError={() => setSrc("/logo.svg")}
      />
    </Link>
  );
}
