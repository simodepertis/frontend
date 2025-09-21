"use client";

import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4">
      <div className="flex gap-6 py-6">
        <div className="hidden md:block w-64 shrink-0">
          <DashboardSidebar />
        </div>
        <div className="md:hidden -mx-4">
          {/* On mobile we stack content, sidebar can come via a drawer in future */}
          <DashboardSidebar />
        </div>
        <main className="flex-1 min-h-[60vh]">
          {children}
        </main>
      </div>
    </div>
  );
}
