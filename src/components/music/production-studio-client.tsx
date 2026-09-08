"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Plus,
  Search,
  Users,
  Disc3,
  Sparkles,
  FileText,
  Sliders,
  FileCode2,
  Trash2,
  Edit3,
  Globe2,
  Music2,
  X,
  FolderInput,
} from "lucide-react";
import { Spinner } from "@heroui/react";
import { toast } from "sonner";

import { CollapsibleCard } from "@/components/collapsible-card";
import { BandManagerModal } from "@/components/music/band-manager-modal";
import { ProductionStudioModal } from "@/components/music/production-studio-modal";
import {
  ProductionSongProvider,
  useProductionSong,
} from "@/components/music/production-song-context";
import {
  fetchSongs,
  fetchProjects,
  createSong,
  deleteSong,
  updateSong,
} from "@/lib/music/client";
import type { ProductionStudioTabId } from "@/lib/hub-access";
import type { MusicSongSummary, MusicProjectRecord } from "@/lib/music/types";

type ProductionStudioClientProps = {
  allowedTabs: Array<{ id: ProductionStudioTabId; label: string }>;
  initialTab: ProductionStudioTabId;
};

const GENRE_PRESETS = ["Rock", "Metal", "Pop", "Electronic", "Jazz", "Hip Hop", "Acoustic", "Indie", "Classical"];
const KEY_PRESETS = ["C Major", "A Minor", "G Major", "E Minor", "D Major", "B Minor", "F Major", "D Minor", "F# Minor"];

function ProductionStudioDashboard() {
  const { setSelectedSongId, refreshSongs } = useProductionSong();
  const [songs, setSongs] = useState<MusicSongSummary[]>([]);
  const [projects, setProjects] = useState<MusicProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string>("all");

  // Modals state
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [studioInitialTab, setStudioInitialTab] = useState<ProductionStudioTabId>("song");
  const [isBandModalOpen, setIsBandModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<MusicProjectRecord | null>(null);
  const [isNewSongModalOpen, setIsNewSongModalOpen] = useState(false);

  // Move song to band state
  const [moveSongTarget, setMoveSongTarget] = useState<MusicSongSummary | null>(null);
  const [moveSongSlug, setMoveSongSlug] = useState("");
  const [movingSong, setMovingSong] = useState(false);

  // New Song Draft State
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongBpm, setNewSongBpm] = useState("120");
  const [newSongKey, setNewSongKey] = useState("A Minor");
  const [newSongGenre, setNewSongGenre] = useState("Rock");
  const [newSongProjectSlug, setNewSongProjectSlug] = useState("");
  const [creatingSong, setCreatingSong] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [songsRes, projectsRes] = await Promise.all([
        fetchSongs(),
        fetchProjects().catch(() => ({ projects: [] })),
      ]);
      setSongs(songsRes.songs || []);
      setProjects(projectsRes.projects || []);
    } catch (err) {
      toast.error((err as Error).message || "Failed to load songs and bands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This effect synchronizes the catalog with the authenticated API on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = song.title.toLowerCase().includes(query);
        const matchesTopic = song.topic?.toLowerCase().includes(query) || false;
        const matchesGenre = song.genre?.toLowerCase().includes(query) || false;
        const matchesEmotion = song.emotion?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesTopic && !matchesGenre && !matchesEmotion) {
          return false;
        }
      }

      if (selectedGenre !== "all" && song.genre !== selectedGenre) {
        return false;
      }

      if (selectedKey !== "all" && song.musical_key !== selectedKey) {
        return false;
      }

      if (selectedProjectSlug !== "all") {
        if (selectedProjectSlug === "solo") {
          if (song.project_slug) return false;
        } else if (song.project_slug !== selectedProjectSlug) {
          return false;
        }
      }

      return true;
    });
  }, [songs, search, selectedGenre, selectedKey, selectedProjectSlug]);

  const activeProject = useMemo(() => {
    if (selectedProjectSlug === "all" || selectedProjectSlug === "solo") return null;
    return projects.find((p) => p.slug === selectedProjectSlug) || null;
  }, [projects, selectedProjectSlug]);

  const handleOpenStudio = (songId: string, tab: ProductionStudioTabId = "song") => {
    setSelectedSongId(songId);
    setStudioInitialTab(tab);
    setIsStudioModalOpen(true);
  };

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongTitle.trim()) {
      toast.error("Song title is required");
      return;
    }

    try {
      setCreatingSong(true);
      const res = await createSong({
        title: newSongTitle.trim(),
        bpm: Number(newSongBpm) || 120,
        musical_key: newSongKey || null,
        genre: newSongGenre || null,
        project_slug: newSongProjectSlug || null,
      });

      toast.success(`Created "${res.song.song.title}"`);
      await loadData();
      await refreshSongs();
      setIsNewSongModalOpen(false);
      setNewSongTitle("");

      // Open in studio modal right away
      handleOpenStudio(res.song.song.id, "song");
    } catch (err) {
      toast.error((err as Error).message || "Failed to create song");
    } finally {
      setCreatingSong(false);
    }
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${songTitle}"?`)) return;
    try {
      await deleteSong(songId);
      toast.success(`Deleted "${songTitle}"`);
      await loadData();
      await refreshSongs();
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete song");
    }
  };

  const openMoveModal = (song: MusicSongSummary) => {
    setMoveSongTarget(song);
    setMoveSongSlug(song.project_slug || "");
  };

  const handleMoveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveSongTarget) return;
    setMovingSong(true);
    try {
      await updateSong(moveSongTarget.id, { project_slug: moveSongSlug || null });
      const destination = moveSongSlug
        ? (projects.find((p) => p.slug === moveSongSlug)?.name ?? moveSongSlug)
        : "Solo (No Band)";
      toast.success(`"${moveSongTarget.title}" moved to ${destination}`);
      setMoveSongTarget(null);
      await loadData();
      await refreshSongs();
    } catch (err) {
      toast.error((err as Error).message || "Failed to move song");
    } finally {
      setMovingSong(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Band & Project Hub Bar (Always Open / Important) */}
      <CollapsibleCard
        defaultOpen={true}
        title="Bands & Project Workspaces"
        subtitle="Organize songs by band and collaborate with registered users across your private workspace"
        eyebrow="Shared Production"
        icon={<Users className="h-4 w-4 text-[var(--color-brass)]" />}
        badge={
          <span className="glass-pill px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-brass)]">
            {projects.length} Bands
          </span>
        }
        headerActions={
          <button
            type="button"
            onClick={() => {
              setProjectToEdit(null);
              setIsBandModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-brass)] to-[var(--color-gold)] px-3.5 py-1.5 text-xs font-bold text-black shadow-sm transition hover:brightness-110 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Band / Project</span>
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedProjectSlug("all")}
              className={`glass-pill flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedProjectSlug === "all"
                  ? "glass-pill-active text-[var(--color-foreground)] border-[var(--color-info-border)]"
                  : "text-[var(--color-sand-2)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>All Workspace Songs</span>
              <span className="ml-1 rounded-full bg-[var(--color-surface-soft)] px-1.5 py-0.2 text-[10px]">
                {songs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedProjectSlug("solo")}
              className={`glass-pill flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedProjectSlug === "solo"
                  ? "glass-pill-active text-[var(--color-foreground)]"
                  : "text-[var(--color-sand-2)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <Music className="h-3.5 w-3.5" />
              <span>Solo (No Band)</span>
              <span className="ml-1 rounded-full bg-[var(--color-surface-soft)] px-1.5 py-0.2 text-[10px]">
                {songs.filter((s) => !s.project_slug).length}
              </span>
            </button>

            {projects.map((proj) => {
              const isSelected = selectedProjectSlug === proj.slug;
              return (
                <div key={proj.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectSlug(proj.slug)}
                    className={`glass-pill flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? "glass-pill-active text-[var(--color-foreground)] shadow-xs"
                        : "text-[var(--color-sand-2)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shadow-xs"
                      style={{ backgroundColor: proj.color || "#f59e0b" }}
                    />
                    <span>{proj.name}</span>
                    <span className="rounded-full bg-[var(--color-surface-soft)] px-1.5 py-0.2 text-[10px]">
                      {proj.songCount}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {activeProject && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm"
                  style={{ backgroundColor: activeProject.color || "#f59e0b" }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                      {activeProject.name}
                    </h3>
                    <span className="glass-pill px-2 py-0.5 text-[10px] text-[var(--color-brass)]">
                      {activeProject.memberCount} Members
                    </span>
                  </div>
                  {activeProject.description && (
                    <p className="line-clamp-1 text-xs text-[var(--color-sand-2)]">
                      {activeProject.description}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProjectToEdit(activeProject);
                  setIsBandModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-foreground)] shadow-xs transition hover:border-[var(--color-copper)]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Manage Band & Members</span>
              </button>
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* 2. Songs Catalog & Search / Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-sand-2)]" />
            <input
              type="text"
              placeholder="Search songs by title, genre, topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field pl-9 text-xs"
            />
          </div>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="field w-auto text-xs"
          >
            <option value="all">All Genres</option>
            {GENRE_PRESETS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="field w-auto text-xs"
          >
            <option value="all">All Keys</option>
            {KEY_PRESETS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewSongProjectSlug(selectedProjectSlug !== "all" && selectedProjectSlug !== "solo" ? selectedProjectSlug : "");
            setIsNewSongModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-copper)] to-[var(--color-rust)] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Song</span>
        </button>
      </div>

      {/* 3. Songs Grid */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <Spinner size="lg" color="warning" />
          <p className="text-xs text-[var(--color-sand-2)]">Loading song catalog...</p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="panel flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[1.75rem] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-brass)]">
            <Music2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--color-foreground)]">No songs found</h3>
            <p className="text-xs text-[var(--color-sand-2)]">
              {search ? "No songs match your search filters." : "Create your first song to unlock the full production studio suite."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsNewSongModalOpen(true)}
            className="mt-2 flex items-center gap-1.5 rounded-xl bg-[var(--color-copper)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Create First Song
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song, index) => {
            const songProject = projects.find((p) => p.slug === song.project_slug);
            return (
              <motion.div
                key={song.id}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="min-w-0"
              >
                <CollapsibleCard
                  defaultOpen={index === 0}
                  title={song.title}
                  subtitle={[song.genre, song.emotion].filter(Boolean).join(" / ") || "Unclassified song"}
                  eyebrow={songProject ? songProject.name : "Solo track"}
                  icon={<Music2 className="h-4 w-4 text-[var(--color-brass)]" />}
                  badge={
                    <div className="flex items-center gap-1.5">
                      {song.musical_key && <span className="glass-pill px-2 py-0.5 text-[10px] font-bold text-[var(--color-copper)]">{song.musical_key}</span>}
                      {song.bpm && <span className="glass-pill px-2 py-0.5 text-[10px] font-bold text-[var(--color-brass)]">{song.bpm} BPM</span>}
                    </div>
                  }
                  headerActions={
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenStudio(song.id, "song")}
                        title={`Open ${song.title} in studio`}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-brass)] to-[var(--color-gold)] px-3 py-1.5 text-[11px] font-bold text-black shadow-sm transition hover:brightness-110 active:scale-95"
                      >
                        <Disc3 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Open</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openMoveModal(song)}
                        title="Move to another band / project"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-sand-2)] transition hover:border-[var(--color-brass)]/40 hover:text-[var(--color-brass)]"
                      >
                        <FolderInput className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSong(song.id, song.title)}
                        title="Delete song"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-sand-2)] transition hover:border-red-500/30 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  }
                  variant="glass"
                  className="h-full"
                  bodyClassName="pt-4"
                >
                <div className="space-y-4">
                  {song.topic && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-sand-2)]">
                      {song.topic}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--color-sand-2)]">
                    <span className="flex items-center gap-1">
                      <Sliders className="h-3 w-3 text-[var(--color-copper)]" />
                      {song.section_count} sections
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileCode2 className="h-3 w-3 text-[var(--color-mint)]" />
                      {song.layer_count} layers
                    </span>
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-1.5 border-t border-[var(--color-stroke)] pt-4 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleOpenStudio(song.id, "lyrics")}
                      className="flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] py-2 text-[10px] font-semibold text-[var(--color-sand-2)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                      title="Lyrics & Rhymes"
                    >
                      <FileText className="h-3 w-3 text-[var(--color-brass)]" /> Lyrics
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenStudio(song.id, "song")}
                      className="flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] py-2 text-[10px] font-semibold text-[var(--color-sand-2)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                      title="Song Studio"
                    >
                      <Music2 className="h-3 w-3 text-[var(--color-copper)]" /> Chords
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenStudio(song.id, "audio")}
                      className="flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] py-2 text-[10px] font-semibold text-[var(--color-sand-2)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                      title="Audio DAW"
                    >
                      <Sliders className="h-3 w-3 text-[var(--color-purple)]" /> Audio
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenStudio(song.id, "notation")}
                      className="flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] py-2 text-[10px] font-semibold text-[var(--color-sand-2)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                      title="Notation & Tabs"
                    >
                      <FileCode2 className="h-3 w-3 text-[var(--color-mint)]" /> Tabs
                    </button>
                  </div>
                </CollapsibleCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. Unified Studio Workspace Modal (Contains Lyrics, Song, Audio, Notation) */}
      <ProductionStudioModal
        isOpen={isStudioModalOpen}
        initialTab={studioInitialTab}
        songs={songs}
        projects={projects}
        onClose={() => setIsStudioModalOpen(false)}
      />

      {/* 5. Band Manager Modal */}
      <BandManagerModal
        isOpen={isBandModalOpen}
        projectToEdit={projectToEdit}
        onClose={() => setIsBandModalOpen(false)}
        onSaved={async () => {
          await loadData();
        }}
        onDeleted={async () => {
          setSelectedProjectSlug("all");
          await loadData();
        }}
      />

      {/* 6. Move Song to Band Modal */}
      <AnimatePresence>
        {moveSongTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoveSongTarget(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-modal-surface)] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-stroke)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brass)] text-black shadow-md">
                    <FolderInput className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="eyebrow text-[0.62rem]">Move Track</div>
                    <h2 className="text-lg font-bold tracking-tight text-[var(--color-foreground)]">
                      Move to Band / Project
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMoveSongTarget(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-sand-2)] transition hover:text-[var(--color-foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleMoveSong} className="space-y-4 p-6">
                <p className="text-sm text-[var(--color-sand-2)]">
                  Moving{" "}
                  <span className="font-bold text-[var(--color-foreground)]">
                    &quot;{moveSongTarget.title}&quot;
                  </span>{" "}
                  from{" "}
                  <span className="font-semibold text-[var(--color-brass)]">
                    {moveSongTarget.project_slug
                      ? (projects.find((p) => p.slug === moveSongTarget.project_slug)?.name ?? moveSongTarget.project_slug)
                      : "Solo (No Band)"}
                  </span>
                </p>

                <div className="space-y-1.5">
                  <label className="field-label">Destination Band / Project</label>
                  <select
                    className="field text-sm"
                    value={moveSongSlug}
                    onChange={(e) => setMoveSongSlug(e.target.value)}
                  >
                    <option value="">Solo (No Band)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-[var(--color-stroke)] pt-3">
                  <button
                    type="button"
                    onClick={() => setMoveSongTarget(null)}
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-sand-2)] transition hover:text-[var(--color-foreground)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={movingSong || moveSongSlug === (moveSongTarget.project_slug ?? "")}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-brass)] to-[var(--color-gold)] px-5 py-2 text-xs font-bold text-black shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                  >
                    {movingSong ? <Spinner size="sm" color="current" /> : <FolderInput className="h-3.5 w-3.5" />}
                    <span>Move Track</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Quick New Song Modal */}
      <AnimatePresence>
        {isNewSongModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewSongModalOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-modal-surface)] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-stroke)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-copper)] text-white shadow-md">
                    <Music2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="eyebrow text-[0.62rem]">Studio Project</div>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
                      Create New Song
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewSongModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-sand-2)] transition hover:text-[var(--color-foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSong} className="space-y-4 p-6">
                <div className="space-y-1.5">
                  <label className="field-label">Song Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Midnight Horizon, Neon Requiem..."
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    className="field text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="field-label">Tempo (BPM)</label>
                    <input
                      type="number"
                      min={40}
                      max={280}
                      value={newSongBpm}
                      onChange={(e) => setNewSongBpm(e.target.value)}
                      className="field text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label">Musical Key</label>
                    <select
                      value={newSongKey}
                      onChange={(e) => setNewSongKey(e.target.value)}
                      className="field text-sm"
                    >
                      {KEY_PRESETS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="field-label">Genre</label>
                    <select
                      value={newSongGenre}
                      onChange={(e) => setNewSongGenre(e.target.value)}
                      className="field text-sm"
                    >
                      {GENRE_PRESETS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label">Assign to Band / Project</label>
                    <select
                      value={newSongProjectSlug}
                      onChange={(e) => setNewSongProjectSlug(e.target.value)}
                      className="field text-sm"
                    >
                      <option value="">Solo (No Band)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-stroke)]">
                  <button
                    type="button"
                    onClick={() => setIsNewSongModalOpen(false)}
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-sand-2)] transition hover:text-[var(--color-foreground)]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creatingSong}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-copper)] to-[var(--color-rust)] px-5 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                  >
                    {creatingSong ? <Spinner size="sm" color="current" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Create & Launch Studio</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductionStudioClient({}: ProductionStudioClientProps) {
  return (
    <ProductionSongProvider>
      <ProductionStudioDashboard />
    </ProductionSongProvider>
  );
}
