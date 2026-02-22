import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  loadRoadmapData,
  saveRoadmapData,
  loadChecks,
  saveChecks,
  makeTaskKey,
  type RoadmapPayload,
  type RoadmapDay,
} from "../lib/roadmapStore";

const pageWrap =
  "min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white";
const container = "mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14";

const buttonGhost =
  "inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 active:scale-[0.99]";

function dayCardClass(done: boolean) {
  return [
    "rounded-2xl border shadow-sm transition",
    done
      ? "border-emerald-200 bg-emerald-50"
      : "border-neutral-200 bg-white hover:bg-neutral-50",
  ].join(" ");
}

function badgeClass(kind: string) {
  const k = kind.toLowerCase();
  if (k === "study") return "bg-blue-600 text-white";
  if (k === "pratice" || k === "practice") return "bg-neutral-900 text-white";
  return "bg-neutral-100 text-neutral-900 border border-neutral-200";
}

function difficultyPill(diff?: string) {
  if (!diff) return null;
  const d = diff.toLowerCase();
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold border";
  if (d === "easy") return `${base} border-emerald-200 bg-emerald-50 text-emerald-800`;
  if (d === "medium") return `${base} border-amber-200 bg-amber-50 text-amber-800`;
  if (d === "hard") return `${base} border-rose-200 bg-rose-50 text-rose-800`;
  return `${base} border-neutral-200 bg-neutral-50 text-neutral-700`;
}

function getDummyRoadmap(): RoadmapPayload {
  return [
    {
      day: 1,
      date_placeholder: "Day 1",
      focus_area: "arrays & strings | hashing",
      hours_allocated: 2,
      checklist: [
        {
          type: "study",
          title: "Arrays & Strings patterns: prefix sums, frequency arrays",
          url: "https://leetcode.com/explore/learn/card/array-and-string/",
          topic: "Arrays & Strings",
          reason: "Build foundation for common interview patterns.",
        },
        {
          type: "pratice",
          title: "Two Sum",
          difficulty: "easy",
          topic: "Hashmap",
          url: "https://leetcode.com/problems/two-sum/",
          reason: "Classic hashmap lookup pattern.",
        },
        {
          type: "pratice",
          title: "Group Anagrams",
          difficulty: "medium",
          topic: "Hashmap",
          url: "https://leetcode.com/problems/group-anagrams/",
          reason: "Great for frequency signature thinking.",
        },
      ],
    },
    {
      day: 2,
      date_placeholder: "Day 2",
      focus_area: "two pointers | sliding window",
      hours_allocated: 2,
      checklist: [
        {
          type: "study",
          title: "Sliding window template: fixed vs variable window",
          url: "https://leetcode.com/discuss/general-discussion/657507/sliding-window-for-beginners-problems-template-sample-solutions",
          topic: "Sliding Window",
          reason: "Template makes a lot of problems feel identical.",
        },
        {
          type: "pratice",
          title: "Longest Substring Without Repeating Characters",
          difficulty: "medium",
          topic: "Sliding Window",
          url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
          reason: "Core variable window pattern.",
        },
        {
          type: "pratice",
          title: "Valid Palindrome",
          difficulty: "easy",
          topic: "Two Pointers",
          url: "https://leetcode.com/problems/valid-palindrome/",
          reason: "Simple two-pointer invariant practice.",
        },
      ],
    },
    // Your example day (kept exactly in your shape)
    {
      day: 6,
      date_placeholder: "Day 6",
      focus_area: "dynamic programming | Networking basics | Concurrency",
      hours_allocated: 2,
      checklist: [
        {
          type: "study",
          title: "DP Foundation: Understanding Memoization vs. Tabulation",
          url: "https://example.com/dp-memo-tab",
          topic: "dynamic programming",
          reason: "Study a low-confidence, high-reward topic (1/2).",
        },
        {
          type: "study",
          title: "Basic Server-Client Architecture in TCP (Qualcomm Topic)",
          url: "https://example.com/tcp-client-server",
          topic: "Networking",
          reason: "TCP basics were mentioned as relevant to Qualcomm interviews.",
        },
        {
          type: "pratice",
          title: "Climbing Stairs (DP)",
          difficulty: "easy",
          topic: "dynamic programming",
          url: "https://leetcode.com/problems/climbing-stairs/",
          reason: "Classic DP problem to practice memoization.",
        },
        {
          type: "pratice",
          title: "Coin Change (DP)",
          difficulty: "medium",
          topic: "dynamic programming",
          url: "https://leetcode.com/problems/coin-change/",
          reason: "Classic DP problem covering optimization techniques.",
        },
      ],
    },
  ];
}

function normalizeDays(payload: RoadmapPayload): RoadmapDay[] {
  const copy = [...payload];
  copy.sort((a, b) => a.day - b.day);
  return copy;
}

function isDayDone(day: RoadmapDay, checks: Record<string, boolean>) {
  if (!day.checklist?.length) return false;
  return day.checklist.every((_, idx) => checks[makeTaskKey(day.day, idx)] === true);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = React.useState<RoadmapDay[]>([]);
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const saved = loadRoadmapData();
    if (!saved) {
      // dummy content for now
      const dummy = getDummyRoadmap();
      saveRoadmapData(dummy);
      setData(normalizeDays(dummy));
    } else {
      setData(normalizeDays(saved));
    }
    setChecks(loadChecks());
  }, []);

  const totalTasks = data.reduce((acc, d) => acc + (d.checklist?.length ?? 0), 0);
  const doneTasks = data.reduce((acc, d) => {
    const doneInDay = (d.checklist ?? []).filter((_, idx) => checks[makeTaskKey(d.day, idx)]).length;
    return acc + doneInDay;
  }, 0);
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  function toggle(dayNum: number, idx: number) {
    const key = makeTaskKey(dayNum, idx);
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveChecks(next);
      return next;
    });
  }

  return (
    <div className={pageWrap}>
      <div className={container}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Your plan, day-by-day. Check things off as you go.
            </p>

            <div className="mt-4 w-full max-w-md">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>
                  Progress:{" "}
                  <span className="font-semibold text-neutral-900">{progress}%</span>
                </span>
                <span>
                  {doneTasks}/{totalTasks} tasks
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
                <div
                  className="h-2 rounded-full bg-neutral-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className={buttonGhost} onClick={() => navigate("/roadmap-ready")}>
              Back
            </button>
            <button className={buttonGhost} onClick={() => navigate("/mock-interview")}>
              Mock
           </button>
            <button
              className={buttonGhost}
              onClick={() => {
                // quick reset only for checkmarks, not data
                saveChecks({});
                setChecks({});
              }}
              title="Clears completed states"
            >
              Reset checks
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((day) => {
            const done = isDayDone(day, checks);

            return (
              <div key={day.day} className={dayCardClass(done)}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold">{day.date_placeholder}</h2>
                      <p className="mt-1 text-xs text-neutral-600">
                        Focus: {day.focus_area}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Hours: {day.hours_allocated}
                      </p>
                    </div>

                    {done && (
                      <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                        Done
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3">
                    {(day.checklist ?? []).map((item, idx) => {
                      const key = makeTaskKey(day.day, idx);
                      const checked = checks[key] === true;

                      return (
                        <div
                          key={key}
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggle(day.day, idx)}
                              className={[
                                "mt-0.5 h-5 w-5 flex-none rounded border transition",
                                checked
                                  ? "border-neutral-900 bg-neutral-900"
                                  : "border-neutral-300 bg-white hover:bg-neutral-50",
                              ].join(" ")}
                              aria-label={checked ? "Mark incomplete" : "Mark complete"}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={[
                                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                                    badgeClass(item.type),
                                  ].join(" ")}
                                >
                                  {item.type}
                                </span>

                                {item.difficulty ? (
                                  <span className={difficultyPill(item.difficulty) ?? ""}>
                                    {item.difficulty}
                                  </span>
                                ) : null}

                                {item.topic ? (
                                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                                    {item.topic}
                                  </span>
                                ) : null}
                              </div>

                              <p
                                className={[
                                  "mt-2 text-sm font-semibold",
                                  checked ? "text-neutral-400 line-through" : "text-neutral-900",
                                ].join(" ")}
                              >
                                {item.title}
                              </p>

                              {item.reason ? (
                                <p className="mt-1 text-xs text-neutral-600">{item.reason}</p>
                              ) : null}

                              {item.url ? (
                                <a
                                  className="mt-2 inline-block text-xs font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open resource
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-xs text-neutral-500">
                    {Object.keys(checks).filter((k) => k.startsWith(`d${day.day}_`) && checks[k]).length}
                    /{day.checklist?.length ?? 0} completed
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}