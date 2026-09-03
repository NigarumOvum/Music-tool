"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Music2,
  Sliders,
  FileCode2,
  Maximize2,
  Minimize2,
  ChevronRight,
  Disc3,
  Layers,
} from "lucide-react";
import { Spinner } from "@heroui/react";

import { useProductionSong } from "@/components/music/production-song-context";
import type { ProductionStudioTabId } from "@/lib/hub-access";
import type { MusicSongSummary, MusicProjectRecord } from "@/lib/music/types";

const tabLoaders = {
  lyrics: () => import("@/components/music/lyrics-library-client").then((module) => module.LyricsLibraryClient),
  song: () => import("@/components/music/song-studio-client").then((module) => module.SongStudioClient),
  audio: () => import("@/components/music/daw-client").then((module) => module.DawClient),
  notation: () => import("@/components/music/tab-studio-client").then((module) => module.TabStudioClient),
} as const;

const tabPanels: Record<ProductionStudioTabId, ReturnType<typeof dynamic>> = {
  lyrics: dynamic(() => tabLoaders.lyrics().then((Component) => ({ default: Component })), { ssr: false }),
  song: dynamic(() => tabLoaders.song().then((Component) => ({ default: Component })), { ssr: false }),
  audio: dynamic(() => tabLoaders.audio().then((Component) => ({ default: Component })), { ssr: false }),
  notation: dynamic(() => tabLoaders.notation().then((Component) => ({ default: Component })), { ssr: false }),
};

const STUDIO_TABS: Array<{ id: ProductionStudioTabId; label: string; icon: typeof Music2; description: string }> = [
  { id: "song", label: "Song Studio", icon: Music2, description: "Structure, chords, metadata & AI prompts" },
  { id: "lyrics", label: "Lyrics & Rhymes", icon: FileText, description: "Lyrics editor, rhyming & syllables" },
  { id: "audio", label: "Audio DAW", icon: Sliders, description: "Multitrack synth, sequencer & audio recorder" },
  { id: "notation", label: "Notation & Tabs", icon: FileCode2, description: "Fretboard tabs, partitures & playback" },
];

type ProductionStudioModalProps = {
  isOpen: boolean;
  initialTab?: ProductionStudioTabId;
  songs: MusicSongSummary[];
  projects: MusicProjectRecord[];
  onClose: () => void;
};

export function ProductionStudioModal({
  isOpen,
  initialTab = "song",
  songs,
  projects,
  onClose,
}: ProductionStudioModalProps) {
  const { selectedSongId, setSelectedSongId } = useProductionSong();
  const [activeTab, setActiveTab] = useState<ProductionStudioTabId>(initialTab);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const activeSong = useMemo(
    () => songs.find((s) => s.id === selectedSongId) || songs[0] || null,
    [songs, selectedSongId]
  );

  const activeProject = useMemo(() => {
    if (!activeSong?.project_slug) return null;
    return projects.find((p) => p.slug === activeSong.project_slug) || null;
  }, [projects, activeSong]);

  const ActiveComponent = tabPanels[activeTab];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`studio-modal-shell relative z-10 flex flex-col overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-modal-surface)] shadow-2xl transition-all duration-200 ${
              isFullscreen ? "h-[98vh] w-[99vw] max-w-none rounded-2xl" : "h-[92vh] w-full max-w-7xl"
            }`}
          >
            {/* Sticky Studio Header */}
            <div className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stroke)] bg-[var(--color-surface-strong)] px-5 py-3.5 backdrop-blur-xl">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-brass)] shadow-xs">
                  <Disc3 className="h-5 w-5 animate-[spin_8s_linear_infinite]" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="eyebrow text-[0.62rem]">Studio Workspace</span>
                    {activeProject && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: activeProject.color || "#f59e0b" }}
                      >
                        <Layers className="h-3 w-3" />
                        {activeProject.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSongId}
                      onChange={(e) => setSelectedSongId(e.target.value)}
                      className="max-w-[240px] truncate rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-sm font-bold text-[var(--color-foreground)] outline-none transition hover:border-[var(--color-copper)]"
                    >
                      {songs.map((song) => (
                        <option key={song.id} value={song.id}>
                          {song.title} {song.musical_key ? `(${song.musical_key})` : ""}
                        </option>
                      ))}
                    </select>

                    {activeSong?.bpm && (
                      <span className="glass-pill px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-brass)]">
                        {activeSong.bpm} BPM
                      </span>
                    )}

                    {activeSong?.musical_key && (
                      <span className="glass-pill px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-copper)]">
                        {activeSong.musical_key}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Studio Workspace Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-1">
                {STUDIO_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[var(--color-surface-strong)] text-[var(--color-foreground)] shadow-md border border-[var(--color-border)]"
                          : "text-[var(--color-sand-2)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)]/60"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? "text-[var(--color-brass)]" : "text-[var(--color-sand-2)]"
                        }`}
                      />
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeStudioTab"
                          className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-[var(--color-brass)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions: Fullscreen & Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Studio"}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-sand-2)] transition hover:text-[var(--color-foreground)]"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  title="Close Studio (Esc)"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-sand-2)] transition hover:text-[var(--color-foreground)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <Suspense
                fallback={
                  <div className="flex min-h-[380px] items-center justify-center">
                    <Spinner size="lg" color="warning" />
                  </div>
                }
              >
                {ActiveComponent ? <ActiveComponent /> : null}
              </Suspense>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
