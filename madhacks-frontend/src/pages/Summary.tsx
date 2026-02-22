import * as React from "react";
import { useNavigate } from "react-router-dom";

const ROADMAP_KEY = "madhacks_roadmap_data_v1";

const pageWrap = "min-h-screen";
const container = "mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14";

const card = "rounded-2xl border-2 border-[#202026] bg-[#000000] shadow-sm";

const buttonPrimary =
  "inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-6 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99]";

const buttonGhost =
  "inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-50 hover:text-black active:scale-[0.99]";

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

    if (!s.major_focus_areas || typeof s.major_focus_areas !== "object")
      return null;
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

  const [summary] = React.useState<SummaryShape>(() => {
    const stored = safeParseRoadmapSummary();
    if (stored) return stored;

    return {
      major_focus_areas: {
        Arrays:
          "High importance and low confidence; focus on Two-Pointers and O(N) solutions.",
        OS: "Highest importance and low confidence; focus on Process/Memory/Concurrency theory.",
        Stacks:
          "High importance and low confidence; focus on advanced structures like Monotonic Stack.",
        "Dynamic Programming":
          "Medium/High importance and low confidence; focus on pattern recognition.",
        Hashing:
          "Medium/High importance; focus on collision resolution and prefix-sum patterns.",
      },
      total_study_resources: 0,
      total_leetcode_problems: 0,
    };
  });

  const focusEntries = React.useMemo(() => {
    const entries = Object.entries(summary.major_focus_areas || {});
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [summary]);

  return (
    <div className={pageWrap}>
      <div className={container}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-md font-semibold tracking-wide text-[#7aecc4]">
              SUMMARY
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-white">
              Here’s what to focus on first
            </h1>
          </div>
        </div>

        <div className="mt-6">
          <div className={`${card} overflow-hidden`}>
            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {focusEntries.map(([topic, note]) => (
                  <div
                    key={topic}
                    className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-4 transition"
                  >
                    <div className="flex items-center h-full gap-3">
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-neutral-900 text-xs font-semibold text-[#7aecc4]">
                        {initials(topic.replace(/[^a-zA-Z\s]/g, ""))}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold tracking-wide text-white uppercase">
                          {topic}
                        </p>
                        <p className="mt-1 text-xs text-neutral-300">{note}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl p-0 sm:flex-row">
                <button className={buttonGhost} onClick={() => navigate("/")}>
                  Start Over
                </button>
                <button
                  className={buttonPrimary}
                  onClick={() => navigate("/roadmap")}
                >
                  View Roadmap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
