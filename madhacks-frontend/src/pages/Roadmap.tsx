import * as React from "react";
import { useNavigate } from "react-router-dom";
import { loadChecks, saveChecks, makeTaskKey } from "../lib/roadmapStore";

const ROADMAP_KEY = "madhacks_roadmap_data_v1";

type RoadmapChecklistItem = {
  type: string;
  title: string;
  url?: string;
  topic?: string;
  reason?: string;
  difficulty?: string;
};

type RoadmapDay = {
  day: number;
  date_placeholder?: string;
  focus_area?: string;
  hours_allocated?: number;
  checklist?: RoadmapChecklistItem[];
};

type SummaryShape = {
  major_focus_areas: Record<string, string>;
  total_study_resources: number;
  total_leetcode_problems: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function normalizeType(kind: string | undefined) {
  const k = String(kind || "").toLowerCase().trim();
  if (k === "pratice" || k === "leetcode" || k === "practice") return "practice";
  if (k === "study") return "study";
  return k || "task";
}

function badgeClass(kind: string) {
  const k = normalizeType(kind);
  if (k === "study")    return "bg-blue-600/20 text-blue-400 border border-blue-600/30";
  if (k === "practice") return "bg-purple-600/20 text-purple-400 border border-purple-600/30";
  return "bg-white/5 text-neutral-400 border border-white/10";
}

function difficultyClass(diff?: string) {
  if (!diff) return null;
  const d = diff.toLowerCase();
  if (d === "easy")   return "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30";
  if (d === "medium") return "bg-amber-600/20 text-amber-400 border border-amber-600/30";
  if (d === "hard")   return "bg-red-600/20 text-red-400 border border-red-600/30";
  return "bg-white/5 text-neutral-400 border border-white/10";
}

function isValidDay(x: any): x is RoadmapDay {
  return (
    x && typeof x === "object" &&
    typeof x.day === "number" &&
    (x.checklist === undefined || Array.isArray(x.checklist))
  );
}

function normalizeRoadmapFromStorage(raw: string | null) {
  if (!raw) return { obj: null, days: [], summary: null };
  let parsed: any = null;
  try { parsed = JSON.parse(raw); } catch { return { obj: raw, days: [], summary: null }; }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.roadmap)) {
    return { obj: parsed, days: parsed.roadmap.filter(isValidDay), summary: parsed.summary ?? null };
  }
  if (Array.isArray(parsed)) return { obj: parsed, days: parsed.filter(isValidDay), summary: null };
  if (isValidDay(parsed))    return { obj: parsed, days: [parsed], summary: null };
  return { obj: parsed, days: [], summary: null };
}

function sortDays(days: RoadmapDay[]) {
  return [...days].sort((a, b) => a.day - b.day);
}

function isDayDone(day: RoadmapDay, checks: Record<string, boolean>) {
  const list = day.checklist ?? [];
  if (list.length === 0) return false;
  return list.every((_, idx) => checks[makeTaskKey(day.day, idx)] === true);
}

function coerceSummary(x: any): SummaryShape | null {
  if (!x || typeof x !== "object") return null;
  if (!x.major_focus_areas || typeof x.major_focus_areas !== "object") return null;
  if (typeof x.total_study_resources !== "number") return null;
  if (typeof x.total_leetcode_problems !== "number") return null;
  return x as SummaryShape;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function Roadmap() {
  const navigate = useNavigate();
  const [days,    setDays]    = React.useState<RoadmapDay[]>([]);
  const [checks,  setChecks]  = React.useState<Record<string, boolean>>({});
  const [summary, setSummary] = React.useState<SummaryShape | null>(null);
  const [error,   setError]   = React.useState<string | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem(ROADMAP_KEY);
    const { days: extracted, summary: extractedSummary } = normalizeRoadmapFromStorage(raw);
    setSummary(coerceSummary(extractedSummary));
    if (!extracted.length) {
      setError("No roadmap found. Generate it first, then come back here.");
      setDays([]);
    } else {
      setError(null);
      setDays(sortDays(extracted));
    }
    setChecks(loadChecks());
  }, []);

  const totalTasks = days.reduce((acc, d) => acc + (d.checklist?.length ?? 0), 0);
  const doneTasks  = days.reduce((acc, d) => {
    return acc + (d.checklist ?? []).filter((_, idx) => checks[makeTaskKey(d.day, idx)]).length;
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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 flex flex-col gap-6">

        {/* ── Top section: title + stats ── */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: title + progress */}
          <div className="w-full lg:max-w-xl flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">STUDY ROADMAP</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-white">
                Check things off as you go.
              </h1>
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-500">{error}</p>
            ) : (
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span>Progress: <span className="font-semibold text-neutral-300">{progress}%</span></span>
                  <span>{doneTasks}/{totalTasks} tasks</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#202026] overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[#7aecc4] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: stat cards */}
          <div className="grid grid-cols-2 gap-4 w-fit">
            <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Study Resources</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#7aecc4]">
                {summary ? summary.total_study_resources : "—"}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">LeetCode Problems</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#7aecc4]">
                {summary ? summary.total_leetcode_problems : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {!days.length && (
          <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-10 text-center flex flex-col items-center gap-4">
            <p className="text-sm font-semibold text-neutral-400">Nothing to show yet.</p>
            <p className="text-sm text-neutral-600">Go back to Summary and click View my roadmap after generating the plan.</p>
            <button
              onClick={() => navigate("/summary")}
              className="inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-white px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              Back to Summary
            </button>
          </div>
        )}

        {/* ── Day cards grid ── */}
        {days.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {days.map((day) => {
              const done     = isDayDone(day, checks);
              const dayDone  = (day.checklist ?? []).filter((_, idx) => checks[makeTaskKey(day.day, idx)]).length;
              const dayTotal = day.checklist?.length ?? 0;

              return (
                <div
                  key={day.day}
                  className={`rounded-2xl border-2 bg-[#090b10] transition-all duration-300 ${
                    done ? "border-[#7aecc4]/40" : "border-[#202026]"
                  }`}
                >
                  <div className="p-5 flex flex-col gap-4">
                    {/* Day header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                          {day.date_placeholder || `Day ${day.day}`}
                        </h2>
                        {day.focus_area && (
                          <p className="mt-1 text-xs text-neutral-500">Focus: {day.focus_area}</p>
                        )}
                      </div>
                      {done ? (
                        <span className="rounded-full bg-[#7aecc4] px-2.5 py-1 text-xs font-bold text-black flex-shrink-0">
                          Done
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#202026] bg-black px-2.5 py-1 text-xs font-semibold text-neutral-500 flex-shrink-0">
                          {dayDone}/{dayTotal}
                        </span>
                      )}
                    </div>

                    {/* Mini progress bar */}
                    {dayTotal > 0 && (
                      <div className="h-1 w-full rounded-full bg-[#202026] overflow-hidden">
                        <div
                          className="h-1 rounded-full bg-[#7aecc4] transition-all duration-500"
                          style={{ width: `${Math.round((dayDone / dayTotal) * 100)}%` }}
                        />
                      </div>
                    )}

                    {/* Checklist items */}
                    <div className="flex flex-col gap-2.5">
                      {(day.checklist ?? []).map((item, idx) => {
                        const key     = makeTaskKey(day.day, idx);
                        const checked = checks[key] === true;
                        const typeN   = normalizeType(item.type);

                        return (
                          <div
                            key={key}
                            className={`rounded-xl border-2 px-3 py-3 transition-all duration-200 ${
                              checked ? "border-[#7aecc4]/20 bg-[#7aecc4]/5" : "border-[#202026] bg-black hover:bg-[#202026]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <button
                                onClick={() => toggle(day.day, idx)}
                                className={[
                                  "mt-0.5 h-5 w-5 flex-none rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                                  checked
                                    ? "border-[#7aecc4] bg-[#7aecc4]"
                                    : "border-[#303036] bg-transparent hover:border-[#7aecc4]/50",
                                ].join(" ")}
                                aria-label={checked ? "Mark incomplete" : "Mark complete"}
                              >
                                {checked && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass(typeN)}`}>
                                    {typeN}
                                  </span>
                                  {item.difficulty && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${difficultyClass(item.difficulty)}`}>
                                      {item.difficulty}
                                    </span>
                                  )}
                                  {item.topic && (
                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-white/5 text-neutral-400 border border-white/10">
                                      {item.topic}
                                    </span>
                                  )}
                                </div>

                                {/* Title */}
                                {item.url ? (
                                  <a href={item.url} target="_blank" rel="noreferrer" className="group">
                                    <p className={`text-sm font-semibold leading-snug transition-colors ${
                                      checked ? "text-neutral-600 line-through" : "text-white group-hover:text-[#7aecc4]"
                                    }`}>
                                      {item.title}
                                    </p>
                                  </a>
                                ) : (
                                  <p className={`text-sm font-semibold leading-snug ${
                                    checked ? "text-neutral-600 line-through" : "text-white"
                                  }`}>
                                    {item.title}
                                  </p>
                                )}

                                {item.reason && (
                                  <p className="mt-1 text-xs text-neutral-500 leading-snug">{item.reason}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-xs text-neutral-500">
                      {dayDone}/{dayTotal} completed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              Home
            </button>
          </div>
          <button
            onClick={() => navigate("/mock-interview")}
            className="inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-6 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99]"
          >
            Mock
          </button>
        </div>
      </div>
    </div>
  );
}