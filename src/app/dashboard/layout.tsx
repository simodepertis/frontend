"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex gap-6 py-6">
        <div className="hidden md:block w-64 shrink-0">
          <DashboardSidebar />
        </div>

        <div className="md:hidden w-full">
          <div className="-mx-4 px-4 mb-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="px-3 py-2 bg-gray-800 text-white rounded-md border border-gray-700"
            >
              ☰ Menu
            </button>
          </div>

          {mobileOpen && (
            <div className="fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setMobileOpen(false)}
              />
              <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-xs bg-[#0f2a5c] shadow-2xl overflow-y-auto">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <div className="text-white font-semibold">Menu</div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="text-white/80 hover:text-white text-lg"
                  >
                    ✕
                  </button>
                </div>
                <DashboardSidebar />
              </div>
            </div>
          )}
        </div>

        <main className="flex-1 min-h-[60vh] w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
