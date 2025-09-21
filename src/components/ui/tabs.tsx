import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ value, onValueChange, className, children }: {
  value: string;
  onValueChange: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  // Provide context for value and onValueChange
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (val: string) => void;
} | null>(null);

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="tablist" className={cn("flex border-b border-gray-600", className)}>{children}</div>
  );
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      className={cn(
        "px-6 py-2 text-lg font-medium transition-colors border-b-2 focus:outline-none",
        isActive ? "border-blue-400 text-blue-400 bg-gray-700" : "border-transparent text-gray-300 hover:bg-gray-700",
        className
      )}
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return <div>{children}</div>;
}
