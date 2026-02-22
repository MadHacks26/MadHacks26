import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import LevelSlider from "../components/LevelSlider";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

type Step = 1 | 2 | 3 | 4;

const PROFILE_KEY = "madhacks_profile_v1";
const ROADMAP_KEY = "madhacks_roadmap_data_v1";

function saveProfile(profile: any) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function clampName(name: string) {
  return name.trim().split(" ")[0].slice(0, 24);
}

function syncLevelsFromKeys(keys: string[], prev: Record<string, number>, defaultValue = 5) {
  const next: Record<string, number> = {};
  for (const k of keys) next[k] = typeof prev[k] === "number" ? prev[k] : defaultValue;
  return next;
}

function parsePositiveInt(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > 365) return null;
  return n;
}

function parseHours(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > 23) return null;
  return n;
}

const inputBase =
  "w-full rounded-xl border-2 border-[#202026] bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-[#7aecc4]/40 focus:ring-0";

const buttonPrimary =
  "inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-6 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed";

const buttonGhost =
  "inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed";

const stepVariants = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit:    { opacity: 0, y: -10, filter: "blur(4px)" },
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
  const { dsaConcepts, dsaLevels, coreConcepts, coreLevels, defaultConfidence = 5 } = params;
  const dsa_topics: ConceptProfile["dsa_topics"] = {};
  for (const [topic, importance] of Object.entries(dsaConcepts)) {
    dsa_topics[topic] = { importance: Number(importance), confidence: typeof dsaLevels[topic] === "number" ? dsaLevels[topic] : defaultConfidence };
  }
  const core_fundamentals: ConceptProfile["core_fundamentals"] = {};
  for (const [topic, importance] of Object.entries(coreConcepts)) {
    core_fundamentals[topic] = { importance: Number(importance), confidence: typeof coreLevels[topic] === "number" ? coreLevels[topic] : defaultConfidence };
  }
  return { dsa_topics, core_fundamentals };
}

function roadmapListKey(uid: string) { return `madhacks_roadmaps_list_v1:${uid}`; }

type RoadmapListItem = { id: string; company: string; role: string; createdAt: number; roadmapJson: any };

function appendRoadmapToList(params: { uid: string; company: string; role: string; roadmapJson: any }) {
  const { uid, company, role, roadmapJson } = params;
  try {
    const key = roadmapListKey(uid);
    const list: RoadmapListItem[] = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift({
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      company, role, createdAt: Date.now(), roadmapJson,
    });
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────

export default function Create() {
  const navigate = useNavigate();
  const { user, getIdToken } = useAuth();

  const [step, setStep] = React.useState<Step>(1);

  const [dsaConcepts, setDsaConcepts] = React.useState<Record<string, number>>({
    "Arrays & Strings": 1, Hashmap: 1, "Two Pointers": 1, "Sliding Window": 1,
  });
  const [coreConcepts, setCoreConcepts] = React.useState<Record<string, number>>({
    "Big-O Complexity": 1, Recursion: 1, "Sorting & Searching": 1, "Bit Manipulation": 1,
  });

  // Background fetch state — promise stored in ref so it's stable across renders
  const conceptsPromiseRef = React.useRef<Promise<boolean> | null>(null);
  const [conceptsReady,   setConceptsReady]   = React.useState(false);
  const [conceptsLoading, setConceptsLoading] = React.useState(false);
  const [conceptsError,   setConceptsError]   = React.useState<string | null>(null);

  const [roadmapLoading, setRoadmapLoading] = React.useState(false);
  const [roadmapError,   setRoadmapError]   = React.useState<string | null>(null);

  const [name,        setName]        = React.useState("");
  const [role,        setRole]        = React.useState("");
  const [company,     setCompany]     = React.useState("");
  const [jobLink,     setJobLink]     = React.useState("");
  const [prepDays,    setPrepDays]    = React.useState<string>("");
  const [hoursPerDay, setHoursPerDay] = React.useState<string>("");

  const [dsaLevels,  setDsaLevels]  = React.useState<Record<string, number>>(() =>
    Object.fromEntries(Object.keys(dsaConcepts).map((c) => [c, 5]))
  );
  const [coreLevels, setCoreLevels] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(Object.keys(coreConcepts).map((c) => [c, 5]))
  );

  React.useEffect(() => { setName(user?.displayName ?? ""); });
  React.useEffect(() => { setDsaLevels((prev) => syncLevelsFromKeys(Object.keys(dsaConcepts), prev, 5)); }, [dsaConcepts]);
  React.useEffect(() => { setCoreLevels((prev) => syncLevelsFromKeys(Object.keys(coreConcepts), prev, 5)); }, [coreConcepts]);

  const safeName = clampName(name);

  const canGoNext =
    (step === 1 && role.trim().length >= 2 && company.trim().length >= 2) ||
    (step === 2 && parsePositiveInt(prepDays) !== null && parseHours(hoursPerDay) !== null) ||
    step === 3 || step === 4;

  // ── Fire concept fetch in background, return the promise ──────────────
  function startConceptsFetch(): Promise<boolean> {
    // Don't re-fire if already in-flight or done
    if (conceptsPromiseRef.current) return conceptsPromiseRef.current;

    setConceptsLoading(true);
    setConceptsError(null);
    setConceptsReady(false);

    const promise = fetch(`${API_BASE}/api/concepts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: role.trim(), company: company.trim(), jobLink: jobLink.trim() }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        const data = (await r.json()) as Partial<ConceptsResponse>;

        if (!data.dsaConcepts || typeof data.dsaConcepts !== "object" || Array.isArray(data.dsaConcepts) ||
            !data.coreConcepts || typeof data.coreConcepts !== "object" || Array.isArray(data.coreConcepts)) {
          throw new Error("Backend returned invalid concept format");
        }

        const cleanDsa: Record<string, number> = {};
        for (const [k, v] of Object.entries(data.dsaConcepts)) {
          const key = String(k).trim(); if (!key) continue;
          const num = Number(v); if (Number.isFinite(num)) cleanDsa[key] = num;
        }
        const cleanCore: Record<string, number> = {};
        for (const [k, v] of Object.entries(data.coreConcepts)) {
          const key = String(k).trim(); if (!key) continue;
          const num = Number(v); if (Number.isFinite(num)) cleanCore[key] = num;
        }
        if (!Object.keys(cleanDsa).length || !Object.keys(cleanCore).length) {
          throw new Error("Backend returned empty concepts");
        }

        setDsaConcepts(cleanDsa);
        setCoreConcepts(cleanCore);
        setConceptsReady(true);
        return true;
      })
      .catch((e: any) => {
        setConceptsError(e?.message ?? "Failed to generate concepts");
        conceptsPromiseRef.current = null; // allow retry
        return false;
      })
      .finally(() => setConceptsLoading(false));

    conceptsPromiseRef.current = promise;
    return promise;
  }

  // ── Step 1 → 2: fire fetch in background, advance immediately ─────────
  async function next() {
    if (!canGoNext) return;

    if (step === 1) {
      startConceptsFetch(); // fire and forget
      setStep(2);
      return;
    }

    if (step === 2) {
      // Block until concepts are ready before moving to step 3
      if (conceptsPromiseRef.current && !conceptsReady) {
        const ok = await conceptsPromiseRef.current;
        if (!ok) return; // error shown, stay on step 2
      }
      setStep(3);
      return;
    }

    setStep((s) => Math.min(4, (s + 1) as Step) as Step);
  }

  function back() {
    if (step === 2) {
      // Reset so user can change role/company and re-trigger
      conceptsPromiseRef.current = null;
      setConceptsReady(false);
      setConceptsError(null);
    }
    setStep((s) => Math.max(1, (s - 1) as Step) as Step);
  }

  function onEnterNext(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !canGoNext) return;
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
    if (hoursTooltipTimer.current) window.clearTimeout(hoursTooltipTimer.current);
    hoursTooltipTimer.current = window.setTimeout(() => setHoursTooltipOpen(false), 1600);
  }

  React.useEffect(() => {
    return () => { if (hoursTooltipTimer.current) window.clearTimeout(hoursTooltipTimer.current); };
  }, []);

  // ── Generate: wait for concepts if still in-flight, then call /api/roadmap ──
  async function finish() {
    setRoadmapLoading(true);
    setRoadmapError(null);

    const prepDaysNum = parsePositiveInt(prepDays);
    const hoursNum    = Number(hoursPerDay);
    if (prepDaysNum == null || !Number.isFinite(hoursNum) || hoursNum <= 0 || hoursNum > 23) {
      setRoadmapError("Please enter valid prep days and hours per day.");
      setRoadmapLoading(false);
      return;
    }

    // If concepts are still loading, wait for them now (usually already done)
    if (conceptsPromiseRef.current && !conceptsReady) {
      const ok = await conceptsPromiseRef.current;
      if (!ok) {
        setRoadmapError(conceptsError ?? "Failed to load concepts. Please go back and try again.");
        setRoadmapLoading(false);
        return;
      }
    }

    const conceptProfile = buildConceptProfile({ dsaConcepts, dsaLevels, coreConcepts, coreLevels, defaultConfidence: 4 });
    const payload = {
      name: safeName, role: role.trim(), company: company.trim(), jobLink: jobLink.trim(),
      prepDays: prepDaysNum, hoursPerDay: hoursNum, dsaLevels, coreLevels, dsaConcepts, coreConcepts, conceptProfile,
    };
    saveProfile(payload);

    try {
      const r = await fetch(`${API_BASE}/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: payload.role, company: payload.company, jobLink: payload.jobLink,
          prepDays: payload.prepDays, hoursPerDay: payload.hoursPerDay, conceptProfile: payload.conceptProfile,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const roadmapJson = await r.json();
      localStorage.setItem(ROADMAP_KEY, JSON.stringify(roadmapJson));
      const companyName = (roadmapJson as { company?: string }).company || payload.company;
      if (user?.uid) appendRoadmapToList({ uid: user.uid, company: companyName, role: payload.role, roadmapJson });
      const token = await getIdToken();
      if (token) {
        await fetch(`${API_BASE}/api/roadmap/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ company_name: companyName, role: payload.role, roadmap_json: roadmapJson }),
        });
      }
      navigate("/summary");
    } catch (e: any) {
      setRoadmapError(e?.message ?? "Failed to generate roadmap");
    } finally {
      setRoadmapLoading(false);
    }
  }

  const stepLabels = ["Role & Company", "Schedule", "DSA Proficiency", "Core Fundamentals"];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">JARSON.AI</p>

          {/* Step pills */}
          <div className="hidden sm:flex items-center gap-2">
            {stepLabels.map((label, i) => {
              const n = i + 1; const active = step === n; const done = step > n;
              return (
                <div key={n} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${
                  active ? "border-[#7aecc4]/40 bg-[#7aecc4]/10 text-[#7aecc4]"
                  : done  ? "border-[#7aecc4]/20 bg-transparent text-[#7aecc4]/40"
                  :         "border-[#202026] bg-transparent text-neutral-600"
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    done ? "bg-[#7aecc4]/30 text-[#7aecc4]" : active ? "bg-[#7aecc4] text-black" : "bg-[#202026] text-neutral-500"
                  }`}>
                    {done ? "✓" : n}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>

          {/* Mobile progress bars */}
          <div className="sm:hidden flex items-center gap-2">
            {[1,2,3,4].map((n) => (
              <div key={n} className={`h-2 w-8 rounded-full transition-all ${
                step > n ? "bg-[#7aecc4]/40" : step === n ? "bg-[#7aecc4]" : "bg-[#202026]"
              }`} />
            ))}
          </div>
        </div>

        {/* ── Card ── */}
        <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] overflow-hidden">

          {/* Subtle loading bar at top of card when concepts are fetching in background */}
          <div className="h-[2px] w-full bg-[#202026] overflow-hidden">
            {conceptsLoading && (
              <div className="h-full bg-[#7aecc4]/60 animate-pulse w-full" />
            )}
            {conceptsReady && !conceptsLoading && (
              <div className="h-full bg-[#7aecc4] w-full transition-all duration-500" />
            )}
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">

              {/* ── Step 1 ── */}
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                  <h2 className="text-xl font-bold text-white">Hey{safeName ? `, ${safeName}` : ""}!</h2>
                  <p className="mt-1 text-sm text-neutral-400">What role are you aiming for, and where?</p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Job Role</label>
                      <input className={inputBase} placeholder="e.g. SDE Intern" value={role}
                        onChange={(e) => setRole(e.target.value)} onKeyDown={onEnterNext} autoFocus />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Company</label>
                      <input className={inputBase} placeholder="e.g. American Family Insurance" value={company}
                        onChange={(e) => setCompany(e.target.value)} onKeyDown={onEnterNext} />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Job Posting Link</label>
                      <input type="url" className={inputBase} placeholder="https://..." value={jobLink}
                        onChange={(e) => setJobLink(e.target.value)} onKeyDown={onEnterNext} />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={() => navigate("/")}>Back</button>
                    <button className={buttonPrimary} onClick={() => void next()} disabled={!canGoNext}>
                      Next →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                  <h2 className="text-xl font-bold text-white">Let's set your pace</h2>
                  <p className="mt-1 text-sm text-neutral-400">We'll generate a plan that fits your schedule.</p>

                  {/* Concepts error banner (non-blocking) */}
                  {conceptsError && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-red-600/20 bg-red-600/5 text-sm text-red-400">
                      <span>⚠</span>
                      <span>{conceptsError} — </span>
                      <button className="underline font-semibold" onClick={() => { conceptsPromiseRef.current = null; startConceptsFetch(); }}>
                        Retry
                      </button>
                    </div>
                  )}

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border-2 border-[#202026] bg-black p-4 flex flex-col gap-3">
                      <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Prep Days</label>
                      <input
                        inputMode="numeric" pattern="[0-9]*"
                        placeholder="How many days to prep?"
                        value={prepDays} onKeyDown={onEnterNext}
                        onChange={(e) => { const v = e.target.value; if (v === "" || /^[0-9]+$/.test(v)) setPrepDays(v); }}
                        className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      />
                    </div>

                    <div className="rounded-xl border-2 border-[#202026] bg-black p-4 flex flex-col gap-3">
                      <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Daily Hours</label>
                      <div className="relative">
                        <input
                          inputMode="decimal" placeholder="Hours per day?"
                          value={hoursPerDay} onKeyDown={onEnterNext}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") { setHoursPerDay(""); return; }
                            if (/^\d*\.?\d*$/.test(v)) {
                              const num = Number(v);
                              if (!Number.isFinite(num)) { setHoursPerDay(v); return; }
                              if (num > 23) { showHoursTooltip(); return; }
                              setHoursPerDay(v);
                            }
                          }}
                          className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                        <AnimatePresence>
                          {hoursTooltipOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                              exit={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                              className="pointer-events-none absolute right-2 top-2 z-10"
                            >
                              <div className="rounded-lg border border-[#202026] bg-[#090b10] px-3 py-2 text-xs font-semibold text-[#7aecc4]">
                                Cannot exceed 23 hours
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>Back</button>
                    <button className={buttonPrimary} onClick={() => void next()} disabled={!canGoNext}>
                      {conceptsLoading ? "Waiting for concepts…" : "Next →"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3 ── */}
              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                  <h2 className="text-xl font-bold text-white">DSA Proficiency</h2>
                  <p className="mt-1 text-sm text-neutral-400">Slide honestly — this only helps your plan adapt.</p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {Object.entries(dsaConcepts).map(([topic]) => (
                      <LevelSlider key={topic} label={topic} value={dsaLevels[topic] ?? 5}
                        onChange={(v) => setSlider("dsa", topic, v)} leftLabel="Weak" rightLabel="Strong" />
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>Back</button>
                    <button className={buttonPrimary} onClick={() => void next()}>Next →</button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 4 ── */}
              {step === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                  <h2 className="text-xl font-bold text-white">Core Fundamentals</h2>
                  <p className="mt-1 text-sm text-neutral-400">This helps us tune prep beyond just LeetCode.</p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {Object.entries(coreConcepts).map(([topic]) => (
                      <LevelSlider key={topic} label={topic} value={coreLevels[topic] ?? 5}
                        onChange={(v) => setSlider("core", topic, v)} leftLabel="Weak" rightLabel="Strong" />
                    ))}
                  </div>

                  {roadmapError && (
                    <p className="mt-4 text-sm font-medium text-red-400">{roadmapError}</p>
                  )}

                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button className={buttonGhost} onClick={back}>Back</button>
                      <button className={buttonGhost} onClick={() => setStep(1)} disabled={roadmapLoading}>Reset</button>
                    </div>
                    <button className={buttonPrimary} onClick={finish} disabled={roadmapLoading}>
                      {roadmapLoading
                        ? "Generating…"
                        : conceptsLoading
                        ? "Finalising concepts…"
                        : "Generate →"}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}