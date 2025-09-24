"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GalleriaFotoRedirect(){
  const router = useRouter();
  useEffect(()=>{ router.replace("/dashboard/verifica-foto"); },[router]);
  return null;
}
