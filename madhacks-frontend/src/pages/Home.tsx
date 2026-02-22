import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

import { AnimatePresence, motion } from "motion/react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const ROADMAP_KEY = "madhacks_roadmap_data_v1";

type RoadmapResponse = Record<
  string,
  {
    roadmaps?: Record<string, any>;
  }
>;

type RoadmapCard = {
  id: string; // company name (unique per user per your requirement)
  company: string;
  role: string;
  createdAt?: number | null;
  roadmapJson: any; // full roadmap object for that company
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Attempts to find a created timestamp if your backend includes it.
// If you don't store createdAt, it'll just be blank.
function extractCreatedAt(roadmapObj: any): number | null {
  const candidates = [
    roadmapObj?.createdAt,
    roadmapObj?.created_at,
    roadmapObj?.meta?.createdAt,
    roadmapObj?.meta?.created_at,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function coerceCards(userId: string, payload: any): RoadmapCard[] {
  const root = (payload as RoadmapResponse)?.[userId];
  const roadmaps = root?.roadmaps;

  if (!roadmaps || typeof roadmaps !== "object") return [];

  const cards: RoadmapCard[] = Object.entries(roadmaps)
    .filter(([company, obj]) => !!company && obj && typeof obj === "object")
    .map(([company, obj]) => {
      const role = String(obj?.role || "").trim();
      return {
        id: company, // company unique per user
        company: String(obj?.company || company).trim() || company,
        role: role || "Unknown Role",
        createdAt: extractCreatedAt(obj),
        roadmapJson: obj, // IMPORTANT: store the full company roadmap object
      };
    });

  // newest first if createdAt exists
  cards.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return cards;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [roadmaps, setRoadmaps] = React.useState<RoadmapCard[]>([]);
  const [fetching, setFetching] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // ✅ UI-only state (doesn't change your fetching logic)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  async function fetchRoadmapsFromDb(uid: string) {
    setFetching(true);
    setFetchError(null);

    try {
      const url = `${API_BASE}/api/roadmap?user_id=${encodeURIComponent(uid)}`;
      const r = await fetch(url, { method: "GET" });

      if (!r.ok) {
        const text = await r.text();
        console.error("[Home] /api/roadmap error:", text);
        throw new Error(text || `Request failed (${r.status})`);
      }

      const data = await r.json();
      console.log("[Home] /api/roadmap response:", data);

      const cards = coerceCards(uid, data);
      setRoadmaps(cards);
    } catch (e: any) {
      setFetchError(e?.message ?? "Failed to load roadmaps");
      setRoadmaps([]);
    } finally {
      setFetching(false);
    }
  }

  React.useEffect(() => {
    if (!user?.uid) return;
    void fetchRoadmapsFromDb(user.uid);
  }, [user?.uid]);

  const handleView = (rm: RoadmapCard) => {
    // Store for Dashboard/Summary pages (same as your current flow)
    localStorage.setItem(ROADMAP_KEY, JSON.stringify(rm.roadmapJson));
    navigate("/roadmap"); // change if your route is /dashboard or /summary
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch {
      console.log("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090b10]">
        <div className="w-20 h-20 border-4 border-[#7aecc4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.displayName?.split(" ")[0] || null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">
            JASPER.AI
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-300 hidden sm:block">
              {user.email || user.displayName || "User"}
            </span>

            <button
              onClick={handleSignOut}
              title="Sign out"
              className="inline-flex items-center justify-center text-red-600 px-2 text-sm font-semibold transition hover:text-white active:scale-[0.99]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              {displayName ? (
                <>
                  Welcome back,{" "}
                  <span className="text-[#7aecc4]">{displayName}</span>!
                </>
              ) : (
                "Welcome back!"
              )}
            </h1>

            <div className="mt-2 flex items-center gap-3">
              {fetchError && (
                <span className="text-xs text-red-400">{fetchError}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/create")}
            className="inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-5 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] flex-shrink-0"
          >
            Create Roadmap
          </button>
        </div>

        {/* Loading skeleton */}
        {fetching && roadmaps.length === 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-5 animate-pulse"
              >
                <div className="h-4 w-2/3 bg-white/10 rounded" />
                <div className="mt-2 h-4 w-1/2 bg-white/10 rounded" />
                <div className="mt-6 h-10 w-full bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Cards from DB */}
        {roadmaps.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roadmaps.map((rm) => {
                const hovered = hoveredId === rm.id;

                return (
                  <div
                    key={rm.id}
                    onMouseEnter={() => setHoveredId(rm.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="relative overflow-hidden rounded-2xl border border-[#202026] bg-[#090b10] p-5 flex flex-col gap-4 transition-all hover:border-[#7aecc4]/20 hover:shadow-[0_0_0_2px_rgba(122,236,196,0.25),0_0_24px_rgba(122,236,196,0.10)]"
                  >
                    {/* Hover spread effect */}
                    <AnimatePresence>
                      {hovered && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-0 pointer-events-none"
                        >
                          <CanvasRevealEffect
                            animationSpeed={5}
                            containerClassName="bg-transparent"
                            colors={[
                              [122, 236, 196], // #7aecc4
                              [139, 92, 246],
                            ]}
                            opacities={[
                              0.15, 0.15, 0.15, 0.15, 0.15, 0.35, 0.35, 0.35,
                              0.35, 1,
                            ]}
                            dotSize={2}
                            showGradient={false}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-0 z-0 pointer-events-none [mask-image:radial-gradient(240px_at_center,white,transparent)] bg-black/40" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-white">
                            {rm.company || "Unknown Company"}
                          </h3>
                          <span className="text-white/50">•</span>
                          <p className="text-md text-white">
                            {rm.role || "Unknown Role"}
                          </p>
                        </div>

                        {rm.createdAt ? (
                          <p className="text-xs text-neutral-500">
                            {formatDate(rm.createdAt)}
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-600"> </p>
                        )}
                      </div>

                      {/* View button (previous formatting: w-fit, right aligned) */}
                      <button
                        onClick={() => handleView(rm)}
                        className="inline-flex w-fit items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] self-end"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!fetching && roadmaps.length === 0 && (
          <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
            <p className="text-sm font-semibold text-neutral-300">
              No roadmaps yet
            </p>
            <p className="text-xs text-neutral-500">
              Create one and it’ll show up here from the database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
