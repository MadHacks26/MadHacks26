import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

import { AnimatePresence, motion } from "motion/react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

const ROADMAP_KEY = "madhacks_roadmap_data_v1";

function roadmapListKey(uid: string) {
  return `madhacks_roadmaps_list_v1:${uid}`;
}

type RoadmapListItem = {
  id: string;
  company: string;
  role: string;
  createdAt: number;
  roadmapJson: any;
};

function readRoadmapList(uid: string): RoadmapListItem[] {
  try {
    const raw = localStorage.getItem(roadmapListKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean);
  } catch {
    return [];
  }
}

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [roadmaps, setRoadmaps] = React.useState<RoadmapListItem[]>([]);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  React.useEffect(() => {
    if (!user?.uid) return;
    setRoadmaps(readRoadmapList(user.uid));
  }, [user?.uid]);

  const handleView = (rm: RoadmapListItem) => {
    localStorage.setItem(ROADMAP_KEY, JSON.stringify(rm.roadmapJson));
    navigate("/roadmap");
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
            JARSON.AI
          </p>
          <div className="flex items-center gap-2">
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
          </div>
          <button
            onClick={() => navigate("/create")}
            className="inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-5 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] flex-shrink-0"
          >
            Create Roadmap
          </button>
        </div>

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
                    className="relative overflow-hidden rounded-2xl border-2 border-[#202026] bg-[#090b10] p-5 flex flex-col gap-4 transition-all hover:border-[#7aecc4]/20 hover:shadow-[0_0_0_2px_rgba(122,236,196,0.25),0_0_24px_rgba(122,236,196,0.10)]"
                  >
                    {/* hover spread effect */}
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
                              [139, 92, 246], // purple accent like demo
                            ]}
                            opacities={[
                              0.15, 0.15, 0.15, 0.15, 0.15,
                              0.35, 0.35, 0.35, 0.35, 1,
                            ]}
                            dotSize={2}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-0 z-0 pointer-events-none [mask-image:radial-gradient(240px_at_center,white,transparent)] bg-black/40" />

                    {/* content */}
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-white">
                          {rm.company || "Unknown Company"}
                        </h3>
                        <p className="text-md text-white">
                          {rm.role || "Unknown Role"}
                        </p>
                      </div>

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

        {roadmaps.length === 0 && (
          <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
            <p className="text-sm font-semibold text-neutral-300">
              No roadmaps yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}