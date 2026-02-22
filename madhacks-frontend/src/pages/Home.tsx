import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

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

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [roadmaps, setRoadmaps] = React.useState<RoadmapListItem[]>([]);

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
    try { await logout(); navigate("/auth", { replace: true }); }
    catch { console.log("Logout failed"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.displayName?.split(" ")[0] || null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 flex flex-col gap-8">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">JARSON.AI</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-600 hidden sm:block">
              {user.email || user.displayName || "User"}
            </span>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-red-400 px-3 py-2 text-sm font-semibold transition hover:bg-red-600/10 hover:text-red-300 active:scale-[0.99]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Hero heading + Create button ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              {displayName ? `Welcome back, ${displayName}.` : "Welcome back."}
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {roadmaps.length > 0
                ? "Pick up where you left off, or start a new roadmap."
                : "Create your first roadmap to get started."}
            </p>
          </div>
          <button
            onClick={() => navigate("/create")}
            className="inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-5 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] flex-shrink-0"
          >
            + Create Roadmap
          </button>
        </div>

        {/* ── Roadmap list ── */}
        {roadmaps.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Your Roadmaps</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roadmaps.map((rm) => (
                <div
                  key={rm.id}
                  className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-5 flex flex-col gap-4 transition-all hover:border-[#7aecc4]/20"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-white">{rm.company || "Unknown Company"}</h3>
                    <p className="text-sm text-neutral-500">{rm.role || "Unknown Role"}</p>
                    {rm.createdAt && (
                      <p className="text-xs text-neutral-700 mt-1">{formatDate(rm.createdAt)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleView(rm)}
                    className="inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] w-full"
                  >
                    View roadmap →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state (no roadmaps, no dashed box — just a nudge) */}
        {roadmaps.length === 0 && (
          <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
            <p className="text-sm font-semibold text-neutral-400">No roadmaps yet</p>
            <p className="text-xs text-neutral-600">Generate a personalised study plan for your target role.</p>
          </div>
        )}

      </div>
    </div>
  );
}