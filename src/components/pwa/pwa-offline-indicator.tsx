"use client";

import { WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";

export function PWAOfflineIndicator() {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-300 backdrop-blur-md shadow-lg animate-fade-in">
      <WifiOff className="h-3.5 w-3.5" />
      <span>Working Offline (Cached)</span>
    </div>
  );
}
