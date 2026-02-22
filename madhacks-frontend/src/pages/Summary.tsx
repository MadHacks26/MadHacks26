import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const ROADMAP_KEY = "madhacks_roadmap_data_v1";

const pageWrap =
  "min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white";
const container = "mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16";

const card = "rounded-2xl border border-neutral-200 bg-white shadow-sm";

const buttonPrimary =
  "inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]";

type SummaryShape = {
  major_focus_areas: Record<string, string>;
  total_study_resources: number;
  total_leetcode_problems: number;
};

type RoadmapResponseShape = {
  summary?: SummaryShape;
};

function safeParseRoadmapSummary(): SummaryShape | null {
  try {
    const raw = localStorage.getItem(ROADMAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoadmapResponseShape;

    if (!parsed?.summary) return null;

    const s = parsed.summary;

    if (!s.major_focus_areas || typeof s.major_focus_areas !== "object") return null;
    if (typeof s.total_study_resources !== "number") return null;
    if (typeof s.total_leetcode_problems !== "number") return null;

    return s;
  } catch {
    return null;
  }
}

function initials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function Summary() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [summary] = React.useState<SummaryShape>(() => {
    const stored = safeParseRoadmapSummary();
    if (stored) return stored;

    return {
      major_focus_areas: {
        Arrays: "High importance and low confidence; focus on Two-Pointers and O(N) solutions.",
        OS: "Highest importance and low confidence; focus on Process/Memory/Concurrency theory.",
        Stacks:
          "High importance and low confidence; focus on advanced structures like Monotonic Stack.",
        "Dynamic Programming":
          "Medium/High importance and low confidence; focus on pattern recognition.",
        Hashing:
          "Medium/High importance; focus on collision resolution and prefix-sum patterns.",
      },
      total_study_resources: 8,
      total_leetcode_problems: 11,
    };
  });

  const focusEntries = React.useMemo(() => {
    const entries = Object.entries(summary.major_focus_areas || {});
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [summary]);

  return (
    <div className={pageWrap}>
      <header className="sticky top-0 z-10 flex items-center justify-end border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          onClick={async () => {
            await logout();
            navigate("/auth");
          }}
        >
          Logout
        </button>
      </header>
      <div className={container}>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-neutral-500">
              SUMMARY
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Here’s what to focus on first
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              This is the high-impact stuff based on your confidence vs importance.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className={`${card} p-5`}>
            <p className="text-xs font-semibold text-neutral-500">STUDY RESOURCES</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-semibold tracking-tight">
                {summary.total_study_resources}
              </p>
            </div>
          </div>

          <div className={`${card} p-5`}>
            <p className="text-xs font-semibold text-neutral-500">LEETCODE PROBLEMS</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-semibold tracking-tight">
                {summary.total_leetcode_problems}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className={`${card} overflow-hidden`}>
            <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">Major focus areas</h2>
            </div>

            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {focusEntries.map(([topic, note]) => (
                  <div
                    key={topic}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:bg-neutral-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-neutral-900 text-xs font-semibold text-white">
                        {initials(topic)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{topic}</p>
                        <p className="mt-1 text-sm text-neutral-600">{note}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:flex-row">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-neutral-900">
                    Ready to Start?
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Your dashboard has the day-by-day checklist and progress.
                  </p>
                </div>
                <button className={buttonPrimary} onClick={() => navigate("/dashboard")}>
                  View my roadmap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}