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

const pageWrap =
  "min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white";
const container = "mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14";

const card = "rounded-2xl border border-neutral-200 bg-white shadow-sm";

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

function normalizeType(kind: string | undefined) {
  const k = String(kind || "").toLowerCase().trim();
  if (k === "pratice") return "practice";
  if (k === "leetcode") return "practice";
  if (k === "practice") return "practice";
  if (k === "study") return "study";
  return k || "task";
}

function badgeClass(kind: string) {
  const k = normalizeType(kind);
  if (k === "study") return "bg-blue-600 text-white";
  if (k === "practice") return "bg-neutral-900 text-white";
  return "bg-neutral-100 text-neutral-900 border border-neutral-200";
}

function difficultyPill(diff?: string) {
  if (!diff) return null;
  const d = diff.toLowerCase();
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold border";
  if (d === "easy")
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-800`;
  if (d === "medium")
    return `${base} border-amber-200 bg-amber-50 text-amber-800`;
  if (d === "hard") return `${base} border-rose-200 bg-rose-50 text-rose-800`;
  return `${base} border-neutral-200 bg-neutral-50 text-neutral-700`;
}

function isValidDay(x: any): x is RoadmapDay {
  return (
    x &&
    typeof x === "object" &&
    typeof x.day === "number" &&
    (x.checklist === undefined || Array.isArray(x.checklist))
  );
}

function normalizeRoadmapFromStorage(raw: string | null): {
  obj: any;
  days: RoadmapDay[];
  summary: SummaryShape | null;
} {
  if (!raw) return { obj: null, days: [], summary: null };

  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { obj: raw, days: [], summary: null };
  }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.roadmap)) {
    const days = parsed.roadmap.filter(isValidDay);
    const summary = parsed.summary ?? null;
    return { obj: parsed, days, summary };
  }

  if (Array.isArray(parsed)) {
    const days = parsed.filter(isValidDay);
    return { obj: parsed, days, summary: null };
  }

  if (isValidDay(parsed)) {
    return { obj: parsed, days: [parsed], summary: null };
  }

  return { obj: parsed, days: [], summary: null };
}

function sortDays(days: RoadmapDay[]) {
  const copy = [...days];
  copy.sort((a, b) => a.day - b.day);
  return copy;
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [days, setDays] = React.useState<RoadmapDay[]>([]);
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});
  const [summary, setSummary] = React.useState<SummaryShape | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem(ROADMAP_KEY);
    const { obj, days: extracted, summary: extractedSummary } =
      normalizeRoadmapFromStorage(raw);

    console.log("[Dashboard] ROADMAP_KEY =", ROADMAP_KEY);
    console.log("[Dashboard] raw localStorage value:", raw);
    console.log("[Dashboard] parsed object:", obj);
    console.log("[Dashboard] extracted days:", extracted);

    const s = coerceSummary(extractedSummary);
    console.log("[Dashboard] extracted summary:", s);
    setSummary(s);

    if (!extracted.length) {
      setError("No roadmap found. Generate it first, then come back here.");
      setDays([]);
    } else {
      setError(null);
      setDays(sortDays(extracted));
    }

    const c = loadChecks();
    console.log("[Dashboard] loaded checks:", c);
    setChecks(c);
  }, []);

  const totalTasks = days.reduce((acc, d) => acc + (d.checklist?.length ?? 0), 0);
  const doneTasks = days.reduce((acc, d) => {
    const doneInDay = (d.checklist ?? []).filter(
      (_, idx) => checks[makeTaskKey(d.day, idx)]
    ).length;
    return acc + doneInDay;
  }, 0);
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  function toggle(dayNum: number, idx: number) {
    const key = makeTaskKey(dayNum, idx);
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveChecks(next);
      console.log("[Dashboard] toggle", { key, value: next[key] });
      return next;
    });
  }

  return (
    <div className={pageWrap}>
      <div className={container}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full lg:max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Your plan, day-by-day. Check things off as you go.
            </p>

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            ) : (
              <div className="mt-4 w-full max-w-md">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>
                    Progress:{" "}
                    <span className="font-semibold text-neutral-900">
                      {progress}%
                    </span>
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
            )}
          </div>

          <div className="w-fit lg:max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className={`${card} p-5`}>
                <p className="text-xs font-semibold text-neutral-500">
                  STUDY RESOURCES
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-semibold tracking-tight">
                    {summary ? summary.total_study_resources : "—"}
                  </p>
                </div>
              </div>

              <div className={`${card} p-5`}>
                <p className="text-xs font-semibold text-neutral-500">
                  LEETCODE PROBLEMS
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-semibold tracking-tight">
                    {summary ? summary.total_leetcode_problems : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!days.length ? (
          <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-neutral-900">
              Nothing to show yet.
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Go back to Summary and click View my roadmap after generating the plan.
            </p>
            <button
              className={`${buttonGhost} mt-5`}
              onClick={() => navigate("/summary")}
            >
              Back to Summary
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {days.map((day) => {
              const done = isDayDone(day, checks);

              return (
                <div key={day.day} className={dayCardClass(done)}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base font-semibold">
                          {day.date_placeholder || `Day ${day.day}`}
                        </h2>
                        <p className="mt-1 text-xs text-neutral-600">
                          Focus: {day.focus_area || "—"}
                        </p>
                        {typeof day.hours_allocated === "number" ? (
                          <p className="mt-1 text-xs text-neutral-500">
                            Hours: {day.hours_allocated}
                          </p>
                        ) : null}
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

                        const typeNorm = normalizeType(item.type);

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
                                aria-label={
                                  checked ? "Mark incomplete" : "Mark complete"
                                }
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={[
                                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                                      badgeClass(typeNorm),
                                    ].join(" ")}
                                  >
                                    {typeNorm}
                                  </span>

                                  {item.difficulty ? (
                                    <span
                                      className={difficultyPill(item.difficulty) ?? ""}
                                    >
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
                                    checked
                                      ? "text-neutral-400 line-through"
                                      : "text-neutral-900",
                                  ].join(" ")}
                                >
                                  {item.title}
                                </p>

                                {item.reason ? (
                                  <p className="mt-1 text-xs text-neutral-600">
                                    {item.reason}
                                  </p>
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
                      {
                        Object.keys(checks).filter(
                          (k) => k.startsWith(`d${day.day}_`) && checks[k]
                        ).length
                      }
                      /{day.checklist?.length ?? 0} completed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM ROW: left = back/reset, right = mock */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button className={buttonGhost} onClick={() => navigate("/summary")}>
              Back
            </button>
            <button
              className={buttonGhost}
              onClick={() => {
                saveChecks({});
                setChecks({});
                console.log("[Dashboard] checks reset");
              }}
              title="Clears completed states"
              disabled={!days.length}
            >
              Reset checks
            </button>
          </div>

          <div>
            <button
              className={buttonGhost}
              onClick={() => navigate("/mock-interview")}
            >
              Mock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}