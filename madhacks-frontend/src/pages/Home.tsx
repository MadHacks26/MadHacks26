import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LevelSlider from "../components/LevelSlider";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

type Step = 0 | 1 | 2 | 3 | 4;

const PROFILE_KEY = "madhacks_profile_v1";
const ROADMAP_KEY = "madhacks_roadmap_data_v1";

function saveProfile(profile: any) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function clampName(name: string) {
  return name.trim().slice(0, 24);
}

function syncLevelsFromKeys(
  keys: string[],
  prev: Record<string, number>,
  defaultValue = 4
) {
  const next: Record<string, number> = {};
  for (const k of keys) {
    next[k] = typeof prev[k] === "number" ? prev[k] : defaultValue;
  }
  return next;
}

function parsePositiveInt(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n <= 0) return null;
  if (n > 365) return null;
  return n;
}

function parseHours(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  if (n > 23) return null;
  return n;
}

const pageWrap =
  "min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white";
const container = "mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14";
const card = "rounded-2xl border border-neutral-200 bg-white shadow-sm";

const inputBase =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

const buttonPrimary =
  "inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-neutral-300";

const buttonGhost =
  "inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 active:scale-[0.99]";

const stepVariants = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(4px)" },
};

type ConceptsResponse = {
  dsaConcepts: Record<string, number>;
  coreConcepts: Record<string, number>;
};

type ConceptProfile = {
  dsa_topics: Record<string, { importance: number; confidence: number }>;
  core_fundamentals: Record<string, { importance: number; confidence: number }>;
};

function buildConceptProfile(params: {
  dsaConcepts: Record<string, number>;
  dsaLevels: Record<string, number>;
  coreConcepts: Record<string, number>;
  coreLevels: Record<string, number>;
  defaultConfidence?: number;
}): ConceptProfile {
  const {
    dsaConcepts,
    dsaLevels,
    coreConcepts,
    coreLevels,
    defaultConfidence = 4,
  } = params;

  const dsa_topics: ConceptProfile["dsa_topics"] = {};
  for (const [topic, importance] of Object.entries(dsaConcepts)) {
    dsa_topics[topic] = {
      importance: Number(importance),
      confidence:
        typeof dsaLevels[topic] === "number"
          ? dsaLevels[topic]
          : defaultConfidence,
    };
  }

  const core_fundamentals: ConceptProfile["core_fundamentals"] = {};
  for (const [topic, importance] of Object.entries(coreConcepts)) {
    core_fundamentals[topic] = {
      importance: Number(importance),
      confidence:
        typeof coreLevels[topic] === "number"
          ? coreLevels[topic]
          : defaultConfidence,
    };
  }

  return { dsa_topics, core_fundamentals };
}

export default function Home() {
  const navigate = useNavigate();

  const [step, setStep] = React.useState<Step>(0);

  const [dsaConcepts, setDsaConcepts] = React.useState<Record<string, number>>({
    "Arrays & Strings": 1,
    Hashmap: 1,
    "Two Pointers": 1,
    "Sliding Window": 1,
  });

  const [coreConcepts, setCoreConcepts] = React.useState<
    Record<string, number>
  >({
    "Big-O Complexity": 1,
    Recursion: 1,
    "Sorting & Searching": 1,
    "Bit Manipulation": 1,
  });

  const [conceptsLoading, setConceptsLoading] = React.useState(false);
  const [conceptsError, setConceptsError] = React.useState<string | null>(null);

  const [roadmapLoading, setRoadmapLoading] = React.useState(false);
  const [roadmapError, setRoadmapError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [jobLink, setJobLink] = React.useState("");

  const [prepDays, setPrepDays] = React.useState<string>("");
  const [hoursPerDay, setHoursPerDay] = React.useState<string>("");

  const [dsaLevels, setDsaLevels] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(Object.keys(dsaConcepts).map((c) => [c, 4]))
  );

  const [coreLevels, setCoreLevels] = React.useState<Record<string, number>>(
    () => Object.fromEntries(Object.keys(coreConcepts).map((c) => [c, 4]))
  );

  React.useEffect(() => {
    setDsaLevels((prev) =>
      syncLevelsFromKeys(Object.keys(dsaConcepts), prev, 4)
    );
  }, [dsaConcepts]);

  React.useEffect(() => {
    setCoreLevels((prev) =>
      syncLevelsFromKeys(Object.keys(coreConcepts), prev, 4)
    );
  }, [coreConcepts]);

  const safeName = clampName(name);

  const canGoNext =
    (step === 0 && safeName.length >= 2) ||
    (step === 1 && role.trim().length >= 2 && company.trim().length >= 2) ||
    (step === 2 &&
      parsePositiveInt(prepDays) !== null &&
      parseHours(hoursPerDay) !== null) ||
    step === 3 ||
    step === 4;

  async function fetchConcepts(): Promise<boolean> {
    setConceptsLoading(true);
    setConceptsError(null);

    try {
      const r = await fetch(`${API_BASE}/api/concepts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role.trim(),
          company: company.trim(),
          jobLink: jobLink.trim(),
        }),
      });

      if (!r.ok) throw new Error(await r.text());

      const data = (await r.json()) as Partial<ConceptsResponse>;

      if (
        !data.dsaConcepts ||
        typeof data.dsaConcepts !== "object" ||
        Array.isArray(data.dsaConcepts) ||
        !data.coreConcepts ||
        typeof data.coreConcepts !== "object" ||
        Array.isArray(data.coreConcepts)
      ) {
        throw new Error("Backend returned invalid concept format");
      }

      const cleanDsa: Record<string, number> = {};
      for (const [k, v] of Object.entries(data.dsaConcepts)) {
        const key = String(k).trim();
        const num = Number(v);
        if (!key) continue;
        if (Number.isFinite(num)) cleanDsa[key] = num;
      }

      const cleanCore: Record<string, number> = {};
      for (const [k, v] of Object.entries(data.coreConcepts)) {
        const key = String(k).trim();
        const num = Number(v);
        if (!key) continue;
        if (Number.isFinite(num)) cleanCore[key] = num;
      }

      if (
        Object.keys(cleanDsa).length === 0 ||
        Object.keys(cleanCore).length === 0
      ) {
        throw new Error("Backend returned empty concepts");
      }

      setDsaConcepts(cleanDsa);
      setCoreConcepts(cleanCore);
      return true;
    } catch (e: any) {
      setConceptsError(e?.message ?? "Failed to generate concepts");
      return false;
    } finally {
      setConceptsLoading(false);
    }
  }

  async function next() {
    if (!canGoNext) return;

    if (step === 1) {
      const ok = await fetchConcepts();
      if (!ok) return;
    }

    setStep((s) => Math.min(4, (s + 1) as Step) as Step);
  }

  function back() {
    setStep((s) => Math.max(0, (s - 1) as Step) as Step);
  }

  function onEnterNext(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    if (!canGoNext) return;
    e.preventDefault();
    void next();
  }

  function setSlider(group: "dsa" | "core", key: string, value: number) {
    if (group === "dsa") setDsaLevels((prev) => ({ ...prev, [key]: value }));
    else setCoreLevels((prev) => ({ ...prev, [key]: value }));
  }

  const [hoursTooltipOpen, setHoursTooltipOpen] = React.useState(false);
  const hoursTooltipTimer = React.useRef<number | null>(null);

  function showHoursTooltip() {
    setHoursTooltipOpen(true);
    if (hoursTooltipTimer.current)
      window.clearTimeout(hoursTooltipTimer.current);
    hoursTooltipTimer.current = window.setTimeout(() => {
      setHoursTooltipOpen(false);
    }, 1600);
  }

  React.useEffect(() => {
    return () => {
      if (hoursTooltipTimer.current)
        window.clearTimeout(hoursTooltipTimer.current);
    };
  }, []);

  async function finish() {
    setRoadmapLoading(true);
    setRoadmapError(null);

    const prepDaysNum = parsePositiveInt(prepDays);
    const hoursNum = Number(hoursPerDay);

    if (
      prepDaysNum == null ||
      !Number.isFinite(hoursNum) ||
      hoursNum <= 0 ||
      hoursNum > 23
    ) {
      setRoadmapError("Please enter valid prep days and hours per day.");
      setRoadmapLoading(false);
      return;
    }

    const conceptProfile = buildConceptProfile({
      dsaConcepts,
      dsaLevels,
      coreConcepts,
      coreLevels,
      defaultConfidence: 4,
    });

    const payload = {
      name: safeName,
      role: role.trim(),
      company: company.trim(),
      jobLink: jobLink.trim(),
      prepDays: prepDaysNum,
      hoursPerDay: hoursNum,
      dsaLevels,
      coreLevels,
      dsaConcepts,
      coreConcepts,
      conceptProfile,
    };

    saveProfile(payload);

    try {
      const r = await fetch(`${API_BASE}/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: payload.role,
          company: payload.company,
          jobLink: payload.jobLink,
          prepDays: payload.prepDays,
          hoursPerDay: payload.hoursPerDay,
          conceptProfile: payload.conceptProfile,
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        console.error("[Home] /api/roadmap error:", text);
        throw new Error(text);
      }

      const roadmapJson = await r.json();
      console.log("[Home] /api/roadmap response:", roadmapJson);
      console.log("[Home] saving ROADMAP_KEY =", ROADMAP_KEY);
      localStorage.setItem(ROADMAP_KEY, JSON.stringify(roadmapJson));
      console.log(
        "[Home] stored ROADMAP_KEY length:",
        localStorage.getItem(ROADMAP_KEY)?.length
      );

      navigate("/summary");
    } catch (e: any) {
      setRoadmapError(e?.message ?? "Failed to generate roadmap");
    } finally {
      setRoadmapLoading(false);
    }
  }

  return (
    <div className={pageWrap}>
      <div className={container}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Sexy title
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              One line description
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {[0, 1, 2, 3, 4].map((i) => {
              const active = step === i;
              const done = step > i;
              return (
                <div
                  key={i}
                  className={[
                    "h-2.5 w-10 rounded-full transition",
                    done
                      ? "bg-neutral-900"
                      : active
                      ? "bg-neutral-700"
                      : "bg-neutral-200",
                  ].join(" ")}
                />
              );
            })}
          </div>
        </div>

        <div className={`mt-8 ${card}`}>
          <div className="p-5 sm:p-7">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-lg font-semibold">
                    First, what do we call you?
                  </h2>

                  <div className="mt-2 grid gap-3 sm:max-w-md">
                    <label className="text-xs font-medium text-neutral-600">
                      Name
                    </label>
                    <input
                      className={inputBase}
                      placeholder=""
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={onEnterNext}
                      autoFocus
                    />
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <div />
                    <button
                      className={buttonPrimary}
                      onClick={() => void next()}
                      disabled={!canGoNext}
                    >
                      Start
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-lg font-semibold">
                    Hey{safeName ? `, ${safeName}` : ""} 👋
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    What role are you aiming for, and where?
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-neutral-600">
                        Job role
                      </label>
                      <input
                        className={inputBase}
                        placeholder="e.g., SDE Intern"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        onKeyDown={onEnterNext}
                        autoFocus
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-neutral-600">
                        Company
                      </label>
                      <input
                        className={inputBase}
                        placeholder="e.g., AmFam"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        onKeyDown={onEnterNext}
                      />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                      <label className="text-xs font-medium text-neutral-600">
                        Job posting link
                      </label>
                      <input
                        type="url"
                        className={inputBase}
                        placeholder=""
                        value={jobLink}
                        onChange={(e) => setJobLink(e.target.value)}
                        onKeyDown={onEnterNext}
                      />
                    </div>
                  </div>

                  {conceptsError && (
                    <p className="mt-4 text-sm text-red-600">{conceptsError}</p>
                  )}

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>
                      Back
                    </button>
                    <button
                      className={buttonPrimary}
                      onClick={() => void next()}
                      disabled={!canGoNext || conceptsLoading}
                    >
                      {conceptsLoading ? "Generating..." : "Next"}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-lg font-semibold">Let’s set your pace</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    We’ll generate a plan that fits your schedule.
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-neutral-200 bg-white p-4">
                      <label className="text-xs font-medium text-neutral-600">
                        How many days do you have to prep?
                      </label>

                      <div className="mt-3">
                        <input
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="e.g., 14"
                          value={prepDays}
                          onKeyDown={onEnterNext}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^[0-9]+$/.test(v)) setPrepDays(v);
                          }}
                          className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-white p-4">
                      <label className="text-xs font-medium text-neutral-600">
                        Hours per day you can commit
                      </label>

                      <div className="mt-3 relative">
                        <input
                          inputMode="decimal"
                          placeholder="e.g., 2 or 1.5"
                          value={hoursPerDay}
                          onKeyDown={onEnterNext}
                          onChange={(e) => {
                            const v = e.target.value;

                            if (v === "") {
                              setHoursPerDay("");
                              return;
                            }

                            if (/^\d*\.?\d*$/.test(v)) {
                              const num = Number(v);

                              if (!Number.isFinite(num)) {
                                setHoursPerDay(v);
                                return;
                              }

                              if (num > 23) {
                                showHoursTooltip();
                                return;
                              }

                              setHoursPerDay(v);
                            }
                          }}
                          className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />

                        <AnimatePresence>
                          {hoursTooltipOpen && (
                            <motion.div
                              initial={{
                                opacity: 0,
                                y: 6,
                                filter: "blur(6px)",
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                filter: "blur(0px)",
                              }}
                              exit={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                              transition={{
                                duration: 0.22,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="pointer-events-none absolute right-2 top-2 z-10"
                            >
                              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-900 shadow-sm">
                                Cannot exceed 23 hours a day
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>
                      Back
                    </button>
                    <button
                      className={buttonPrimary}
                      onClick={() => void next()}
                      disabled={!canGoNext}
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-lg font-semibold">DSA comfort check</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Slide honestly. This only helps your plan adapt.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {Object.entries(dsaConcepts).map(([topic]) => (
                      <LevelSlider
                        key={topic}
                        label={topic}
                        value={dsaLevels[topic] ?? 4}
                        onChange={(v) => setSlider("dsa", topic, v)}
                        leftLabel="Weak"
                        rightLabel="Strong"
                      />
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>
                      Back
                    </button>
                    <button
                      className={buttonPrimary}
                      onClick={() => void next()}
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-lg font-semibold">Core fundamentals</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    This helps us tune prep beyond just LeetCode.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {Object.entries(coreConcepts).map(([topic]) => (
                      <LevelSlider
                        key={topic}
                        label={topic}
                        value={coreLevels[topic] ?? 4}
                        onChange={(v) => setSlider("core", topic, v)}
                        leftLabel="Weak"
                        rightLabel="Strong"
                      />
                    ))}
                  </div>

                  {roadmapError && (
                    <p className="mt-4 text-sm text-red-600">{roadmapError}</p>
                  )}

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>
                      Back
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        className={buttonGhost}
                        onClick={() => setStep(0)}
                        title="Start over"
                        disabled={roadmapLoading}
                      >
                        Reset
                      </button>
                      <button
                        className={buttonPrimary}
                        onClick={finish}
                        disabled={roadmapLoading}
                      >
                        {roadmapLoading ? "Building..." : "Build my roadmap"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-5 py-4 text-xs text-neutral-500 sm:px-7">
            <p>
              Step{" "}
              <span className="font-semibold text-neutral-700">{step + 1}</span>{" "}
              of <span className="font-semibold text-neutral-700">5</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
