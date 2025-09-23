"use client";

import { useEffect } from "react";

export default function CompilaRedirectPage() {
  useEffect(() => {
    try { window.location.replace("/dashboard/escort/compila/contatti"); } catch {}
  }, []);
  return null;
}
