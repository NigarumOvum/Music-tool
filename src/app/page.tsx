import { AppShell } from "@/components/app-shell";
import { CollapsibleCard } from "@/components/collapsible-card";
import { DashboardCard } from "@/components/dashboard-card";
import { ensureUserCanAccessPage, requireCurrentUser } from "@/lib/auth";
import { canAccessMusicToolkit, canAccessProductionStudio } from "@/lib/hub-access";
import type { ManagedPageKey } from "@/lib/access";
import { Disc3, Wrench, Sparkles } from "lucide-react";

const productionHubItems = [
  {
    href: "/production-studio",
    title: "Production Studio",
    eyebrow: "Unified song workspace",
    description: "Song list, band manager, lyrics editor, browser DAW multitrack, and guitar/bass tab notation in one modal suite.",
    accent: "var(--color-brass)",
    hub: "production" as const,
  },
];

const toolkitItems = [
  {
    href: "/music-toolkit",
    title: "Music Toolkit",
    eyebrow: "Theory and practice",
    description: "Interactive fretboard, scales, chord constructor, progression generator, metronome, tuner, and musician utilities.",
    accent: "var(--color-copper)",
    hub: "toolkit" as const,
  },
];

const promptItems = [
  {
    href: "/prompt-library",
    title: "Prompt Library",
    eyebrow: "AI songcrafting",
    description: "Create, edit, and organize reusable prompts for songwriting passes, arrangement cleanups, and production prep.",
    accent: "var(--color-mint)",
    pageKey: "prompt-library" as ManagedPageKey,
  },
];

export default async function Home() {
  const user = await requireCurrentUser();

  const canProduction = await canAccessProductionStudio(user);
  const canToolkit = await canAccessMusicToolkit(user);
  const canPrompts = await ensureUserCanAccessPage(user, "prompt-library");

  return (
    <AppShell
      title="Music Tool"
      eyebrow="Studio Workspace"
      description="A private, multi-user suite for songwriting, band collaboration, multitrack audio, music theory, and AI prompt workflows."
    >
      <div className="space-y-6">
        {canProduction && (
          <CollapsibleCard
            defaultOpen={true}
            title="Core Production Suite"
            subtitle="Central workspace for your songs, band collaboration, DAW sessions, and notation"
            eyebrow="Primary Suite"
            icon={<Disc3 className="h-5 w-5 text-[var(--color-brass)] animate-[spin_8s_linear_infinite]" />}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productionHubItems.map((item) => (
                <DashboardCard key={item.href} {...item} />
              ))}
            </div>
          </CollapsibleCard>
        )}

        {canToolkit && (
          <CollapsibleCard
            defaultOpen={true}
            title="Creative Theory & Helpers"
            subtitle="Interactive instruments, scale visualizers, chord progressions, and studio utilities"
            eyebrow="Toolkit"
            icon={<Wrench className="h-5 w-5 text-[var(--color-copper)]" />}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {toolkitItems.map((item) => (
                <DashboardCard key={item.href} {...item} />
              ))}
            </div>
          </CollapsibleCard>
        )}

        {canPrompts && (
          <CollapsibleCard
            defaultOpen={false}
            title="AI Prompt Engineering Lab"
            subtitle="Custom prompts, songwriting transformations, and structured task templates"
            eyebrow="Prompting"
            icon={<Sparkles className="h-5 w-5 text-[var(--color-mint)]" />}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {promptItems.map((item) => (
                <DashboardCard key={item.href} {...item} />
              ))}
            </div>
          </CollapsibleCard>
        )}
      </div>
    </AppShell>
  );
}

