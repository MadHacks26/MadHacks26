import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { makeTaskKey } from "../lib/roadmapStore";
import { useAuth } from "../auth";

const RAW_API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const API_ORIGIN = RAW_API_BASE.replace(/\/+$/, "").replace(/\/api$/, "");
const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}/api${p}`;
};

const ROADMAP_KEY = "madhacks_roadmap_data_v1";

type RoadmapChecklistItem = {
  type: string;
  title: string;
  url?: string;
  topic?: string;
  reason?: string;
  difficulty?: string;
  checked?: boolean;
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

type StoredRoadmapShape = {
  company?: string;
  role?: string;
};

type UserRoadmapsResponse = Record<
  string,
  {
    roadmaps?: Record<
      string,
      {
        company?: string;
        role?: string;
        summary?: SummaryShape;
        roadmap?: RoadmapDay[];
      }
    >;
  }
>;

function normalizeType(kind: string | undefined) {
  const k = String(kind || "")
    .toLowerCase()
    .trim();
  if (k === "pratice" || k === "leetcode" || k === "practice")
    return "practice";
  if (k === "study") return "study";
  return k || "task";
}

function badgeClass(kind: string) {
  const k = normalizeType(kind);
  if (k === "study")
    return "bg-blue-600/20 text-blue-400 border border-blue-600/30";
  if (k === "practice")
    return "bg-purple-600/20 text-purple-400 border border-purple-600/30";
  return "bg-white/5 text-neutral-400 border border-white/10";
}

function difficultyClass(diff?: string) {
  if (!diff) return null;
  const d = diff.toLowerCase();
  if (d === "easy")
    return "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30";
  if (d === "medium")
    return "bg-amber-600/20 text-amber-400 border border-amber-600/30";
  if (d === "hard")
    return "bg-red-600/20 text-red-400 border border-red-600/30";
  return "bg-white/5 text-neutral-400 border border-white/10";
}

function isValidDay(x: any): x is RoadmapDay {
  return (
    x &&
    typeof x === "object" &&
    typeof x.day === "number" &&
    (x.checklist === undefined || Array.isArray(x.checklist))
  );
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
  if (!x.major_focus_areas || typeof x.major_focus_areas !== "object")
    return null;
  if (typeof x.total_study_resources !== "number") return null;
  if (typeof x.total_leetcode_problems !== "number") return null;
  return x as SummaryShape;
}

function readSelectedCompanyFromStorage(): string | null {
  try {
    const raw = localStorage.getItem(ROADMAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRoadmapShape;
    if (parsed && typeof parsed.company === "string" && parsed.company.trim()) {
      return parsed.company.trim();
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchUserRoadmaps(
  userId: string
): Promise<UserRoadmapsResponse> {
  const url = `${apiUrl("/roadmap/")}?user_id=${encodeURIComponent(userId)}`;
  const r = await fetch(url, { method: "GET" });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as UserRoadmapsResponse;
}

async function putItem(params: { url: string; checked: boolean }, token: any) {
  const r = await fetch(apiUrl("/roadmap/putitem"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json().catch(() => null);
  if (data && typeof data.ok === "boolean" && data.ok === false) {
    throw new Error(data.message || "Item update failed");
  }
}

export default function Roadmap() {
  const navigate = useNavigate();
  const { user, loading, getIdToken } = useAuth();

  const [days, setDays] = React.useState<RoadmapDay[]>([]);
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});
  const [summary, setSummary] = React.useState<SummaryShape | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  const selectedCompany = React.useMemo(
    () => readSelectedCompanyFromStorage(),
    []
  );

  React.useEffect(() => {
    if (loading) return;
    if (!user?.uid) {
      navigate("/auth", { replace: true });
      return;
    }

    if (!selectedCompany) {
      setError(
        "No company selected. Go back and click View on a roadmap card."
      );
      return;
    }

    setSyncing(true);
    setError(null);

    void (async () => {
      try {
        const payload = await fetchUserRoadmaps(user.uid);

        const userBlock = payload?.[user.uid];
        const roadmaps = userBlock?.roadmaps || {};
        const rm = roadmaps?.[selectedCompany];

        if (!rm || !Array.isArray(rm.roadmap)) {
          setDays([]);
          setSummary(null);
          setChecks({});
          setError(`No roadmap found for ${selectedCompany}.`);
          return;
        }

        const cleanDays = sortDays(rm.roadmap.filter(isValidDay));
        setDays(cleanDays);
        setSummary(coerceSummary(rm.summary));

        const nextChecks: Record<string, boolean> = {};
        for (const d of cleanDays) {
          const list = d.checklist ?? [];
          for (let i = 0; i < list.length; i++) {
            nextChecks[makeTaskKey(d.day, i)] = list[i]?.checked === true;
          }
        }
        setChecks(nextChecks);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load roadmap.");
      } finally {
        setSyncing(false);
      }
    })();
  }, [loading, user?.uid, navigate, selectedCompany]);

  const totalTasks = days.reduce(
    (acc, d) => acc + (d.checklist?.length ?? 0),
    0
  );
  const doneTasks = days.reduce((acc, d) => {
    return (
      acc +
      (d.checklist ?? []).filter((_, idx) => checks[makeTaskKey(d.day, idx)])
        .length
    );
  }, 0);
  const progress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  function toggle(dayNum: number, idx: number) {
    if (!user?.uid || !selectedCompany) return;

    const day = days.find((d) => d.day === dayNum);
    const item = day?.checklist?.[idx];
    const url = item?.url;
    if (!url) return;

    const key = makeTaskKey(dayNum, idx);
    const prev = checks[key] === true;
    const next = !prev;

    setChecks((p) => ({ ...p, [key]: next }));

    setDays((prevDays) =>
      prevDays.map((d) => {
        if (d.day !== dayNum) return d;
        const list = (d.checklist ?? []).map((it, i) =>
          i === idx ? { ...it, checked: next } : it
        );
        return { ...d, checklist: list };
      })
    );

    void (async () => {
      try {
        const token = await getIdToken();

        await putItem({ url, checked: next }, token);
      } catch {
        setChecks((p) => ({ ...p, [key]: prev }));
        setDays((prevDays) =>
          prevDays.map((d) => {
            if (d.day !== dayNum) return d;
            const list = (d.checklist ?? []).map((it, i) =>
              i === idx ? { ...it, checked: prev } : it
            );
            return { ...d, checklist: list };
          })
        );
      }
    })();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full lg:max-w-xl flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">
                STUDY ROADMAP
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-white">
                Check things off as you go.
              </h1>
              {syncing ? (
                <p className="mt-2 text-xs text-neutral-500">Syncing…</p>
              ) : null}
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-500">{error}</p>
            ) : (
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span>
                    Progress:{" "}
                    <span className="font-semibold text-neutral-300">
                      {progress}%
                    </span>
                  </span>
                  <span>
                    {doneTasks}/{totalTasks} tasks
                  </span>
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

          <div className="grid grid-cols-2 gap-4 w-fit">
            <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Study Resources
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#7aecc4]">
                {summary ? summary.total_study_resources : "—"}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                LeetCode Problems
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#7aecc4]">
                {summary ? summary.total_leetcode_problems : "—"}
              </p>
            </div>
          </div>
        </div>

        {!days.length && (
          <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] p-10 text-center flex flex-col items-center gap-4">
            <p className="text-sm font-semibold text-neutral-400">
              Nothing to show yet.
            </p>
          </div>
        )}

        {days.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {days.map((day) => {
              const done = isDayDone(day, checks);
              const dayDone = (day.checklist ?? []).filter(
                (_, idx) => checks[makeTaskKey(day.day, idx)]
              ).length;
              const dayTotal = day.checklist?.length ?? 0;

              return (
                <motion.div
                  key={day.day}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className={`rounded-2xl border-2 bg-[#090b10] transition-all duration-300 ${
                    done ? "border-[#7aecc4]/40" : "border-[#202026]"
                  }`}
                >
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                          {day.date_placeholder || `Day ${day.day}`}
                        </h2>
                        {day.focus_area && (
                          <p className="mt-1 text-xs text-neutral-500">
                            Focus: {day.focus_area}
                          </p>
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

                    {dayTotal > 0 && (
                      <div className="h-1 w-full rounded-full bg-[#202026] overflow-hidden">
                        <div
                          className="h-1 rounded-full bg-[#7aecc4] transition-all duration-500"
                          style={{
                            width: `${Math.round((dayDone / dayTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2.5">
                      {(day.checklist ?? []).map((item, idx) => {
                        const key = makeTaskKey(day.day, idx);
                        const checked = checks[key] === true;
                        const typeN = normalizeType(item.type);

                        return (
                          <div
                            key={key}
                            className={`rounded-xl border-2 px-3 py-3 transition-all duration-200 ${
                              checked
                                ? "border-[#7aecc4]/20 bg-[#7aecc4]/5"
                                : "border-[#202026] bg-black hover:bg-[#202026]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 20,
                                }}
                                onClick={() => toggle(day.day, idx)}
                                className={[
                                  "mt-0.5 h-5 w-5 flex-none rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                                  checked
                                    ? "border-[#7aecc4] bg-[#7aecc4]"
                                    : "border-[#303036] bg-transparent hover:border-[#7aecc4]/50",
                                ].join(" ")}
                                aria-label={
                                  checked ? "Mark incomplete" : "Mark complete"
                                }
                              >
                                {checked && (
                                  <svg
                                    width="10"
                                    height="8"
                                    viewBox="0 0 10 8"
                                    fill="none"
                                  >
                                    <path
                                      d="M1 4L3.5 6.5L9 1"
                                      stroke="black"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </motion.button>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(
                                      typeN
                                    )}`}
                                  >
                                    {typeN}
                                  </span>
                                  {item.difficulty && (
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${difficultyClass(
                                        item.difficulty
                                      )}`}
                                    >
                                      {item.difficulty}
                                    </span>
                                  )}
                                  {item.topic && (
                                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-white/5 text-neutral-400 border border-white/10">
                                      {item.topic}
                                    </span>
                                  )}
                                </div>

                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group"
                                  >
                                    <p
                                      className={`text-sm font-semibold leading-snug transition-colors ${
                                        checked
                                          ? "text-neutral-600 line-through"
                                          : "text-white group-hover:text-[#7aecc4]"
                                      }`}
                                    >
                                      {item.title}
                                    </p>
                                  </a>
                                ) : (
                                  <p
                                    className={`text-sm font-semibold leading-snug ${
                                      checked
                                        ? "text-neutral-600 line-through"
                                        : "text-white"
                                    }`}
                                  >
                                    {item.title}
                                  </p>
                                )}

                                {item.reason && (
                                  <p className="mt-1 text-xs text-neutral-500 leading-snug">
                                    {item.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-800 active:scale-[0.99]"
          >
            Home
          </button>
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
