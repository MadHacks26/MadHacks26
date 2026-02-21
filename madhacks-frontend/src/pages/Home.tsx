import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import LevelSlider from "../components/LevelSlider";

type Step = 0 | 1 | 2 | 3 | 4;

const dsaConcepts = [
  "Arrays & Strings",
  "Hashmaps",
  "Two Pointers",
  "Sliding Window",
];

const coreConcepts = [
  "Big-O Complexity",
  "Recursion",
  "Sorting & Searching",
  "Bit Manipulation",
];

function clampName(name: string) {
  return name.trim().slice(0, 24);
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

function parsePositiveInt(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n <= 0) return null;
  if (n > 365) return null; // prep days max (adjust if you want)
  return n;
}

function parseHours(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  if (n > 23) return null;
  return n;
}

export default function Home() {
  const [step, setStep] = React.useState<Step>(0);

  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [company, setCompany] = React.useState("");

  const [prepDays, setPrepDays] = React.useState<string>("");
  const [hoursPerDay, setHoursPerDay] = React.useState<string>("");

  const [dsaLevels, setDsaLevels] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(dsaConcepts.map((c) => [c, 4]))
  );
  const [coreLevels, setCoreLevels] = React.useState<Record<string, number>>(
    () => Object.fromEntries(coreConcepts.map((c) => [c, 4]))
  );

  const safeName = clampName(name);

  const canGoNext =
    (step === 0 && safeName.length >= 2) ||
    (step === 1 && role.trim().length >= 2 && company.trim().length >= 2) ||
    (step === 2 &&
      parsePositiveInt(prepDays) !== null &&
      parseHours(hoursPerDay) !== null) ||
    step === 3 ||
    step === 4;

  function next() {
    if (!canGoNext) return;
    setStep((s) => Math.min(4, (s + 1) as Step) as Step);
  }

  function back() {
    setStep((s) => Math.max(0, (s - 1) as Step) as Step);
  }

  function onEnterNext(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    if (!canGoNext) return;
    e.preventDefault();
    next();
  }

  function setSlider(group: "dsa" | "core", key: string, value: number) {
    if (group === "dsa") {
      setDsaLevels((prev) => ({ ...prev, [key]: value }));
    } else {
      setCoreLevels((prev) => ({ ...prev, [key]: value }));
    }
  }

  // Tooltip for >23 hours attempt
  const [hoursTooltipOpen, setHoursTooltipOpen] = React.useState(false);
  const hoursTooltipTimer = React.useRef<number | null>(null);

  function showHoursTooltip() {
    setHoursTooltipOpen(true);
    if (hoursTooltipTimer.current) window.clearTimeout(hoursTooltipTimer.current);
    hoursTooltipTimer.current = window.setTimeout(() => {
      setHoursTooltipOpen(false);
    }, 1600);
  }

  React.useEffect(() => {
    return () => {
      if (hoursTooltipTimer.current) window.clearTimeout(hoursTooltipTimer.current);
    };
  }, []);

  function finish() {
    const payload = {
      name: safeName,
      role: role.trim(),
      company: company.trim(),
      prepDays: parsePositiveInt(prepDays),
      hoursPerDay: parseHours(hoursPerDay),
      dsaLevels,
      coreLevels,
    };
    console.log("Profile:", payload);
    alert(
      "Profile saved locally (check console)"
    );
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
                      onClick={next}
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
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>
                      Back
                    </button>
                    <button
                      className={buttonPrimary}
                      onClick={next}
                      disabled={!canGoNext}
                    >
                      Next
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

                              // allow intermediate like "." or "2."
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
                              initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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
                      onClick={next}
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
                    {dsaConcepts.map((c) => (
                      <LevelSlider
                        key={c}
                        label={c}
                        value={dsaLevels[c] ?? 4}
                        onChange={(v) => setSlider("dsa", c, v)}
                        leftLabel="Weak"
                        rightLabel="Strong"
                      />
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>
                      Back
                    </button>
                    <button className={buttonPrimary} onClick={next}>
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
                    {coreConcepts.map((c) => (
                      <LevelSlider
                        key={c}
                        label={c}
                        value={coreLevels[c] ?? 4}
                        onChange={(v) => setSlider("core", c, v)}
                        leftLabel="New"
                        rightLabel="Confident"
                      />
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button className={buttonGhost} onClick={back}>
                      Back
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        className={buttonGhost}
                        onClick={() => setStep(0)}
                        title="Start over"
                      >
                        Reset
                      </button>
                      <button className={buttonPrimary} onClick={finish}>
                        Build my roadmap
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