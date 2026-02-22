import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const pageWrap = "min-h-screen bg-[#090b10]";
const container = "mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14";
const card = "rounded-2xl border-2 border-[#202026] bg-[#000000] shadow-sm";

const buttonPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[#7aecc4] text-black px-5 py-3 text-sm font-semibold tracking-wide transition hover:bg-white hover:text-black active:scale-[0.99] disabled:text-white disabled:cursor-not-allowed disabled:bg-[#1c2b2b]";

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

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  React.useEffect(() => {
    if (!user?.uid) return;
    setRoadmaps(readRoadmapList(user.uid));
  }, [user?.uid]);

  const handleCreateRoadmap = () => {
    navigate("/create");
  };

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
      <div className={pageWrap}>
        <div className={container}>
          <div className="text-sm text-neutral-400">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={pageWrap}>
      <div className={container}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#7aecc4]">
              Jarson.ai
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-red-600 transition hover:text-white active:scale-95"
              aria-label="Sign out"
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

        <div className={`${card} mt-8 p-6 sm:p-8`}>
          {roadmaps.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {roadmaps.map((rm) => (
                <div
                  key={rm.id}
                  className="rounded-2xl border border-[#202026] bg-black p-5"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {rm.company || "Unknown Company"}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    {rm.role || "Unknown Role"}
                  </p>

                  <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className={buttonPrimary}
                      onClick={() => handleView(rm)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={roadmaps.length > 0 ? "mt-8 flex justify-center" : "flex justify-center"}>
            <button
              type="button"
              className={buttonPrimary}
              onClick={handleCreateRoadmap}
            >
              Create Roadmap
            </button>
          </div>
        </div>

        <div className="text-xs p-4 text-neutral-400">
          Signed in as{" "}
          <span className="text-white">
            {user.email || user.displayName || "User"}
          </span>
        </div>
      </div>
    </div>
  );
}