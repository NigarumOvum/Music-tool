"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const INSTALL_DISMISSED_KEY = "music_tool_pwa_dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const checkIsStandalone = useCallback(() => {
    if (typeof window === "undefined") return false;
    const isMediaStandalone =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(display-mode: standalone)").matches
        : false;
    const isNavStandalone =
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true;
    const isReferrerStandalone =
      typeof document !== "undefined" && Boolean(document.referrer?.includes("android-app://"));
    return Boolean(isMediaStandalone || isNavStandalone || isReferrerStandalone);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!window.navigator.onLine);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !("MSStream" in window);
    setIsIOS(isIosDevice);

    if (checkIsStandalone()) {
      setIsInstalled(true);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;

      const dismissedAt = localStorage.getItem(INSTALL_DISMISSED_KEY);
      if (dismissedAt) {
        const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10);
        if (timeSinceDismiss < DISMISS_DURATION_MS) {
          setDeferredPrompt(promptEvent);
          return;
        }
      }

      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.removeItem(INSTALL_DISMISSED_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [checkIsStandalone]);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        dismissInstall();
        return false;
      }
    } catch (error) {
      console.error("[PWA] Error launching install prompt:", error);
      return false;
    }
  };

  const dismissInstall = () => {
    setIsInstallable(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
  };

  return {
    isInstallable,
    isInstalled,
    isOffline,
    isIOS,
    installApp,
    dismissInstall,
  };
}
