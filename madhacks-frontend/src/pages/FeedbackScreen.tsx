import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  generateFeedback,
  type QAPair,
  type FeedbackResult,
} from "../lib/interviewEngine";

const styles = `
  @keyframes spin-ring { to { transform: rotate(360deg); } }
  .animate-spin-ring { animation: spin-ring 0.9s linear infinite; }

  @keyframes fade-up {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:none; }
  }
  .animate-fade-up      { animation: fade-up 0.35s ease both; }
  .animate-fade-up-fast { animation: fade-up 0.2s ease; }

  .score-ring-track { fill:none; stroke:rgba(255,255,255,0.06); stroke-width:6; }
  .score-ring-fill  {
    fill:none; stroke-width:6; stroke-linecap:round;
    stroke-dasharray: 283;
    transition: stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1);
  }

  .score-bar-fill { transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }

  .bd-chevron { transition: transform 0.25s; }
  .bd-chevron.open { transform: rotate(180deg); }
`;

function scoreColor(s: number) {
  if (s >= 75) return "#7aecc4";
  if (s >= 50) return "#fbbf24";
  return "#f87171";
}

function scoreGrade(s: number) {
  if (s >= 90) return "Exceptional";
  if (s >= 75) return "Strong Performance";
  if (s >= 60) return "Good";
  if (s >= 45) return "Needs Improvement";
  return "Significant Gaps";
}

function ringOffset(score: number) {
  return 283 - (score / 100) * 283;
}

export default function FeedbackScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const history = (location.state as { history?: QAPair[] })?.history ?? [];

  const [feedback, setFeedback] = React.useState<FeedbackResult | null>(null);
  const [loading, setLoading] = React.useState(true);
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
            question:
              "How would you find two numbers in an array that sum to a target?",
            answer:
              "I'd use a hashmap to store complements and look them up in O(n).",
            topic: "Arrays / HashMaps",
            score: 85,
            remark:
              "Correct approach and correct complexity. Could have mentioned edge cases like duplicates or empty arrays.",
            suggestedAnswer:
              "Use a hashmap: iterate the array, for each num check if (target - num) exists in the map. If yes, return the pair. Otherwise store num → index. O(n) time, O(n) space. Handle edge cases: empty array, no solution.",
          },
          {
            question:
              "Explain the sliding window technique and when you'd use it.",
            answer:
              "It's when you move a window across an array. Good for substring problems.",
            topic: "Sliding Window",
            score: 58,
            remark:
              "Vague description. Did not differentiate fixed vs variable window, or explain the key invariant idea.",
            suggestedAnswer:
              "Sliding window maintains a subarray [l, r] and expands/shrinks it based on a constraint. Fixed window: move both pointers together. Variable window: expand r, shrink l when constraint violated.",
          },
          {
            question:
              "What is memoization and how does it differ from tabulation?",
            answer:
              "Memoization is caching results. Tabulation is building from the bottom up.",
            topic: "Dynamic Programming",
            score: 70,
            remark:
              "Correct at a high level. Missing call stack implications of memoization and when to prefer each.",
            suggestedAnswer:
              "Memoization = top-down DP: solve recursively, cache results in a map. Tabulation = bottom-up DP: build a table iteratively. Memoization risks stack overflow for deep recursion.",
          },
          {
            question:
              "Describe the time complexity of common sorting algorithms and which you'd pick when.",
            answer:
              "Quicksort is O(n log n) average, merge sort is O(n log n) always. I'd use merge sort for linked lists.",
            topic: "Algorithms",
            score: 80,
            remark:
              "Good answer. Should have mentioned O(n²) worst case for quicksort and stability as a criterion.",
            suggestedAnswer:
              "Quicksort: O(n log n) avg, O(n²) worst — in-place. Merge sort: O(n log n), stable — use for linked lists. Heapsort: O(n log n), in-place, not stable.",
          },
        ],
      };
      setFeedback(demo);
      setLoading(false);
      return;
    }
  }, [history]);

  function handleTryAgain() {
    navigate("/mock-interview");
  }

  function handleRoadmap() {
    navigate("/roadmap");
  }

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">
            MOCK INTERVIEW
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-white">
            Feedback
          </h1>

          <div className="mt-6 flex flex-col gap-6">
            {loading && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
                <div className="animate-spin-ring w-12 h-12 rounded-full border-2 border-[#7aecc4]/15 border-t-[#7aecc4]" />
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  Analysing your answers…
                </p>
              </div>
            )}

            {!loading && feedback && (
              <>
                <div className="flex flex-col gap-3 mb-2">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Overall Score
                  </p>

                  <div className="animate-fade-up rounded-2xl border-2 border-[#202026] bg-[#090b10] p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                      <div className="relative w-[110px] h-[110px] flex-shrink-0 flex items-center justify-center flex-col">
                        <svg
                          viewBox="0 0 100 100"
                          className="absolute inset-0 w-full h-full"
                          style={{ transform: "rotate(-90deg)" }}
                        >
                          <circle
                            className="score-ring-track"
                            cx="50"
                            cy="50"
                            r="45"
                          />
                          <circle
                            className="score-ring-fill"
                            cx="50"
                            cy="50"
                            r="45"
                            stroke={scoreColor(feedback.overallScore)}
                            strokeDashoffset={ringOffset(feedback.overallScore)}
                          />
                        </svg>
                        <span
                          className="relative z-[1] text-[28px] font-bold leading-none"
                          style={{ color: scoreColor(feedback.overallScore) }}
                        >
                          {feedback.overallScore}
                        </span>
                        <span className="relative z-[1] text-xs font-semibold text-neutral-400 tracking-wide">
                          /100
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 text-center sm:text-left flex-1 w-full min-w-0">
                        <p
                          className="text-xl font-bold"
                          style={{ color: scoreColor(feedback.overallScore) }}
                        >
                          {scoreGrade(feedback.overallScore)}
                        </p>
                        <p className="text-sm text-neutral-400 leading-relaxed w-full">
                          {feedback.overallRemark}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Question Breakdown
                  </p>

                  {feedback.breakdown.map((item, i) => {
                    const isOpen = expanded === i;
                    const sc = scoreColor(item.score);

                    return (
                      <div
                        key={i}
                        className="animate-fade-up rounded-2xl border-2 border-[#202026] bg-[#090b10] overflow-hidden"
                        style={{ animationDelay: `${0.07 * i}s` }}
                      >
                        <div
                          className="flex items-center justify-between px-5 py-4 cursor-pointer gap-3 transition-colors hover:bg-white/[0.02]"
                          onClick={() => setExpanded(isOpen ? null : i)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-[#202026] bg-black text-xs font-bold text-neutral-500">
                              {i + 1}
                            </div>
                            <p className="text-sm font-semibold text-white truncate">
                              {item.question}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="hidden sm:block text-xs font-semibold px-2.5 py-1 rounded-full border-2 border-[#202026] bg-black text-neutral-500">
                              {item.topic}
                            </span>
                            <span
                              className="text-xs font-bold px-3 py-1 rounded-full border-2"
                              style={{
                                color: sc,
                                borderColor: `${sc}44`,
                                background: `${sc}12`,
                              }}
                            >
                              {item.score}
                            </span>
                            <span
                              className={`bd-chevron text-neutral-400 text-sm ${
                                isOpen ? "open" : ""
                              }`}
                            >
                              ▾
                            </span>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="animate-fade-up-fast border-t-2 border-[#202026] px-5 pt-5 pb-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 rounded-full bg-[#202026] overflow-hidden">
                                <div
                                  className="score-bar-fill h-full rounded-full"
                                  style={{
                                    width: `${item.score}%`,
                                    background: sc,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-bold text-neutral-500">
                                {item.score}/100
                              </span>
                            </div>

                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                Your Answer
                              </p>
                              <div className="rounded-xl border-2 border-[#202026] bg-black px-4 py-3 text-sm text-white leading-relaxed">
                                {item.answer}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                Feedback
                              </p>
                              <div className="rounded-xl border-2 border-amber-600/20 bg-amber-600/5 px-4 py-3 text-sm text-amber-400 leading-relaxed">
                                {item.remark}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                Suggested Answer
                              </p>
                              <div className="rounded-xl border-2 border-[#7aecc4]/20 bg-[#7aecc4]/5 px-4 py-3 text-sm text-[#7aecc4] leading-relaxed">
                                {item.suggestedAnswer}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleTryAgain}
                    className="inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-800 active:scale-[0.99]"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleRoadmap}
                    className="inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-6 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99]"
                  >
                    Roadmap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
