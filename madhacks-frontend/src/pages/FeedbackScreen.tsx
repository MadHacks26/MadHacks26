import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateFeedback, type QAPair, type FeedbackResult } from "../lib/interviewEngine";

// ─── Minimal style block: only what Tailwind can't express ────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Sora:wght@300;400;500;600;700&display=swap');

  .font-sora { font-family: 'Sora', sans-serif; }
  .font-mono { font-family: 'DM Mono', monospace; }

  /* Dot grid background */
  .fb-grid-bg::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none; z-index: 0;
  }

  /* Top ambient glow */
  .fb-glow {
    position: fixed; top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 400px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(124,240,200,0.06) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  /* Score hero top gradient bar */
  .score-hero-bar::before {
    content: '';
    position: absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, #7cf0c8, #7c9df0, #c07cf0);
  }

  /* SVG ring */
  .score-ring-track { fill:none; stroke:rgba(255,255,255,0.06); stroke-width:6; }
  .score-ring-fill  {
    fill:none; stroke-width:6; stroke-linecap:round;
    stroke-dasharray: 283;
    transition: stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1);
  }

  /* Score bar fill transition */
  .score-bar-fill { transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }

  /* Chevron rotation */
  .bd-chevron { transition: transform 0.25s; }
  .bd-chevron.open { transform: rotate(180deg); }

  /* Animations */
  @keyframes fade-up {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:none; }
  }
  .animate-fade-up { animation: fade-up 0.4s ease both; }
  .animate-fade-up-fast { animation: fade-up 0.25s ease; }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .animate-spin-ring { animation: spin 0.9s linear infinite; }

  /* Primary button glow on hover */
  .btn-primary-glow:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(124,240,200,0.18), 0 0 0 1px rgba(124,240,200,0.3);
  }
  .btn-primary-glow {
    background: linear-gradient(135deg,#7cf0c8,#5ad4a8);
    box-shadow: 0 0 0 0 rgba(124,240,200,0.3);
    transition: all 0.25s;
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 75) return "#7cf0c8";
  if (s >= 50) return "#fbbf24";
  return "#f87171";
}

function scoreGrade(s: number) {
  if (s >= 90) return "Exceptional";
  if (s >= 75) return "Strong performance";
  if (s >= 60) return "Good — some gaps";
  if (s >= 45) return "Needs improvement";
  return "Significant gaps";
}

function ringOffset(score: number) {
  return 283 - (score / 100) * 283;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function FeedbackScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const history  = (location.state as { history?: QAPair[] })?.history ?? [];

  const [feedback, setFeedback] = React.useState<FeedbackResult | null>(null);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<number | null>(0);

  React.useEffect(() => {
    if (!history.length) {
      const demo: FeedbackResult = {
        overallScore: 72,
        overallRemark:
          "The candidate showed a solid grasp of foundational data structures and basic algorithmic thinking. " +
          "Answers were logically sound but lacked depth on complexity analysis and edge case handling. " +
          "With focused practice on DP and system design, performance should improve significantly.",
        breakdown: [
          {
            question: "How would you find two numbers in an array that sum to a target?",
            answer: "I'd use a hashmap to store complements and look them up in O(n).",
            topic: "Arrays / HashMaps",
            score: 85,
            remark: "Correct approach and correct complexity. Could have mentioned edge cases like duplicates or empty arrays.",
            suggestedAnswer: "Use a hashmap: iterate the array, for each num check if (target - num) exists in the map. If yes, return the pair. Otherwise store num → index. O(n) time, O(n) space. Handle edge cases: empty array, no solution.",
          },
          {
            question: "Explain the sliding window technique and when you'd use it.",
            answer: "It's when you move a window across an array. Good for substring problems.",
            topic: "Sliding Window",
            score: 58,
            remark: "Vague description. Did not differentiate fixed vs variable window, or explain the key invariant idea.",
            suggestedAnswer: "Sliding window maintains a subarray [l, r] and expands/shrinks it based on a constraint. Fixed window: move both pointers together. Variable window: expand r, shrink l when constraint violated. Use it for max/min subarray problems, longest substring without repeating chars, etc.",
          },
          {
            question: "What is memoization and how does it differ from tabulation?",
            answer: "Memoization is caching results. Tabulation is building from the bottom up.",
            topic: "Dynamic Programming",
            score: 70,
            remark: "Correct at a high level. Missing call stack implications of memoization and when to prefer each.",
            suggestedAnswer: "Memoization = top-down DP: solve recursively, cache results in a map to avoid recomputation. Tabulation = bottom-up DP: build a table iteratively from base cases. Memoization is easier to implement but risks stack overflow for deep recursion. Tabulation is usually more space-efficient.",
          },
          {
            question: "Describe the time complexity of common sorting algorithms and which you'd pick when.",
            answer: "Quicksort is O(n log n) average, merge sort is O(n log n) always. I'd use merge sort for linked lists.",
            topic: "Algorithms",
            score: 80,
            remark: "Good answer. Should have mentioned O(n log n) worst case for quicksort (O(n²)) and stability as a criterion.",
            suggestedAnswer: "Quicksort: O(n log n) avg, O(n²) worst — use for in-place sorting of arrays. Merge sort: O(n log n) always, stable — use when stability matters or for linked lists. Heapsort: O(n log n), in-place but not stable. Timsort (Python/Java default): hybrid, O(n log n) worst, O(n) best.",
          },
        ],
      };
      setFeedback(demo);
      setLoading(false);
      return;
    }

    generateFeedback(history)
      .then((f) => { setFeedback(f); setLoading(false); })
      .catch((e) => { setError(e?.message ?? "Failed to generate feedback"); setLoading(false); });
  }, []);

  return (
    <>
      <style>{styles}</style>

      {/* Root */}
      <div className="fb-grid-bg font-sora relative min-h-screen bg-[#07070d] text-[#e2e2ee] overflow-x-hidden">
        <div className="fb-glow" />

        {/* ── Header ── */}
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-9 py-[18px] border-b border-white/[0.06] bg-[rgba(7,7,13,0.85)] backdrop-blur-md">
          {/* Logo */}
          <div className="font-mono text-xs tracking-widest uppercase text-white/30">
            prep<span className="text-[#7cf0c8] not-italic">AI</span> · feedback
          </div>

          {/* Step pills */}
          <div className="flex items-center gap-1.5">
            {[
              { label: "01 · Prep",      state: "done"   },
              { label: "02 · Interview", state: "done"   },
              { label: "03 · Feedback",  state: "active" },
            ].map(({ label, state }) => (
              <div
                key={label}
                className={`font-mono text-[10px] tracking-[0.08em] px-3 py-1 rounded-full border
                  ${state === "active"
                    ? "text-[#7cf0c8] border-[rgba(124,240,200,0.35)] bg-[rgba(124,240,200,0.06)]"
                    : state === "done"
                    ? "text-[rgba(124,240,200,0.5)] border-[rgba(124,240,200,0.15)]"
                    : "text-white/25 border-white/[0.08] bg-white/[0.02]"}`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Dashboard btn */}
          <button
            onClick={() => navigate("/roadmap")}
            className="font-mono text-[11px] tracking-[0.08em] uppercase px-[18px] py-2 rounded-[10px] border border-white/10 bg-transparent text-white/35 cursor-pointer transition-all hover:border-white/[0.22] hover:text-white/65"
          >
            Dashboard
          </button>
        </header>

        {/* ── Body ── */}
        <main className="relative z-[1] max-w-[900px] w-full mx-auto px-7 pt-9 pb-16 flex flex-col gap-7">

          {/* ── Loading ── */}
          {loading && (
            <div className="animate-fade-up flex flex-col items-center justify-center min-h-[60vh] gap-5">
              <div className="animate-spin-ring w-12 h-12 rounded-full border-2 border-[rgba(124,240,200,0.15)] border-t-[#7cf0c8]" />
              <div className="font-mono text-xs tracking-widest uppercase text-white/30">Analysing your answers…</div>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="text-center text-[#f87171] font-mono text-[13px]">⚠ {error}</div>
          )}

          {/* ── Feedback ── */}
          {!loading && feedback && (
            <>
              {/* Score hero */}
              <div
                className="score-hero-bar animate-fade-up relative grid grid-cols-[auto_1fr] gap-7 max-sm:grid-cols-1 px-8 py-7 bg-white/[0.02] border border-white/[0.07] rounded-3xl overflow-hidden"
                style={{ animationDelay: "0.05s" }}
              >
                {/* Ring */}
                <div className="relative w-[110px] h-[110px] flex-shrink-0 flex items-center justify-center flex-col">
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle className="score-ring-track" cx="50" cy="50" r="45" />
                    <circle
                      className="score-ring-fill"
                      cx="50" cy="50" r="45"
                      stroke={scoreColor(feedback.overallScore)}
                      strokeDashoffset={ringOffset(feedback.overallScore)}
                    />
                  </svg>
                  <span
                    className="relative z-[1] font-sora text-[28px] font-bold leading-none"
                    style={{ color: scoreColor(feedback.overallScore) }}
                  >
                    {feedback.overallScore}
                  </span>
                  <span className="relative z-[1] font-mono text-[10px] text-white/30 tracking-[0.05em]">/100</span>
                </div>

                {/* Right text */}
                <div className="flex flex-col justify-center gap-2.5">
                  <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/25">Overall Score</div>
                  <div className="text-[22px] font-semibold tracking-tight" style={{ color: scoreColor(feedback.overallScore) }}>
                    {scoreGrade(feedback.overallScore)}
                  </div>
                  <div className="text-[13px] leading-[1.65] text-white/50 max-w-[480px]">
                    {feedback.overallRemark}
                  </div>
                </div>
              </div>

              {/* ── Question breakdown ── */}
              <div>
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-3.5">
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/30">Question breakdown</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <div className="flex flex-col gap-4">
                  {feedback.breakdown.map((item, i) => {
                    const isOpen = expanded === i;
                    const sc = scoreColor(item.score);

                    return (
                      <div
                        key={i}
                        className="animate-fade-up rounded-[18px] border border-white/[0.07] bg-white/[0.02] overflow-hidden"
                        style={{ animationDelay: `${0.08 * i}s` }}
                      >
                        {/* Card header */}
                        <div
                          className="flex items-center justify-between px-5 py-4 cursor-pointer gap-3 transition-colors hover:bg-white/[0.03]"
                          onClick={() => setExpanded(isOpen ? null : i)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="font-mono text-[11px] w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/[0.05] border border-white/[0.08] text-white/40">
                              Q{i + 1}
                            </div>
                            <div className="text-[13px] font-medium text-white/75 whitespace-nowrap overflow-hidden text-ellipsis">
                              {item.question}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <span className="font-mono text-[10px] px-2.5 py-[3px] rounded-full border border-white/[0.08] text-white/30">
                              {item.topic}
                            </span>
                            <span
                              className="font-mono text-[11px] font-medium px-3 py-1 rounded-full border"
                              style={{ color: sc, borderColor: `${sc}33`, background: `${sc}0d` }}
                            >
                              {item.score}
                            </span>
                            <span className={`bd-chevron text-[12px] text-white/20 ${isOpen ? "open" : ""}`}>▾</span>
                          </div>
                        </div>

                        {/* Expanded body */}
                        {isOpen && (
                          <div className="animate-fade-up-fast px-5 pt-4 pb-5 flex flex-col gap-3.5 border-t border-white/[0.05]">
                            {/* Score bar */}
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                                <div
                                  className="score-bar-fill h-full rounded-full"
                                  style={{ width: `${item.score}%`, background: sc }}
                                />
                              </div>
                              <div className="font-mono text-[11px] text-white/40 min-w-[32px] text-right">
                                {item.score}/100
                              </div>
                            </div>

                            {/* Your answer */}
                            <div className="flex flex-col gap-1.5">
                              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/[0.22]">Your answer</div>
                              <div className="text-[13px] leading-[1.65] text-white/60 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                {item.answer}
                              </div>
                            </div>

                            {/* Feedback */}
                            <div className="flex flex-col gap-1.5">
                              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/[0.22]">Feedback</div>
                              <div className="text-[13px] leading-[1.65] text-[rgba(251,191,36,0.75)] px-4 py-3 rounded-xl bg-[rgba(251,191,36,0.04)] border border-[rgba(251,191,36,0.12)]">
                                {item.remark}
                              </div>
                            </div>

                            {/* Suggested answer */}
                            <div className="flex flex-col gap-1.5">
                              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/[0.22]">Suggested answer</div>
                              <div className="text-[13px] leading-[1.65] text-[rgba(124,240,200,0.75)] px-4 py-3 rounded-xl bg-[rgba(124,240,200,0.04)] border border-[rgba(124,240,200,0.12)]">
                                {item.suggestedAnswer}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── CTA footer ── */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                <button
                  onClick={() => navigate("/mock-interview")}
                  className="font-mono text-[11px] tracking-[0.08em] uppercase px-[22px] py-[11px] rounded-xl border border-white/10 bg-transparent text-white/40 cursor-pointer transition-all hover:border-white/[0.22] hover:text-white/70"
                >
                  Try again ↺
                </button>
                <button
                  onClick={() => navigate("/roadmap")}
                  className="btn-primary-glow font-sora text-[13px] font-semibold px-7 py-3 rounded-[14px] border-0 text-[#07140f] cursor-pointer flex items-center gap-2"
                >
                  Back to dashboard →
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}