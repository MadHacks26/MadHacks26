import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateFeedback, type QAPair, type FeedbackResult } from "../lib/interviewEngine";

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fb-root {
    min-height: 100vh;
    background: #07070d;
    color: #e2e2ee;
    font-family: 'Sora', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  .fb-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none; z-index: 0;
  }

  /* top glow */
  .fb-glow {
    position: fixed; top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 400px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(124,240,200,0.06) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  /* ── Header ── */
  .fb-header {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 36px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(7,7,13,0.85); backdrop-filter: blur(12px);
    flex-wrap: wrap; gap: 12px;
  }

  .fb-logo {
    font-family: 'DM Mono', monospace; font-size: 12px;
    letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.3);
  }
  .fb-logo em { color: #7cf0c8; font-style: normal; }

  .step-pills { display:flex; align-items:center; gap:6px; }
  .step-pill {
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.08em; padding: 4px 12px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.02);
  }
  .step-pill.done   { color:rgba(124,240,200,0.5); border-color:rgba(124,240,200,0.15); }
  .step-pill.active { color:#7cf0c8; border-color:rgba(124,240,200,0.35); background:rgba(124,240,200,0.06); }

  .btn-dash {
    font-family: 'DM Mono', monospace; font-size: 11px;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 8px 18px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; color: rgba(255,255,255,0.35);
    cursor: pointer; transition: all 0.2s;
  }
  .btn-dash:hover { border-color:rgba(255,255,255,0.22); color:rgba(255,255,255,0.65); }

  /* ── Content ── */
  .fb-body {
    position: relative; z-index: 1;
    max-width: 900px; width: 100%;
    margin: 0 auto; padding: 36px 28px 60px;
    display: flex; flex-direction: column; gap: 28px;
  }

  /* ── Loading state ── */
  .fb-loading {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 20px; animation: fade-in 0.4s ease;
  }
  .fb-spinner {
    width: 48px; height: 48px; border-radius: 50%;
    border: 2px solid rgba(124,240,200,0.15);
    border-top-color: #7cf0c8;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  .fb-loading-text {
    font-family: 'DM Mono', monospace; font-size: 12px;
    letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3);
  }
  @keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

  /* ── Score hero ── */
  .score-hero {
    display: grid; grid-template-columns: auto 1fr; gap: 28px;
    padding: 28px 32px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px; position: relative; overflow: hidden;
    animation: fade-in 0.5s ease both;
  }
  .score-hero::before {
    content: '';
    position: absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, #7cf0c8, #7c9df0, #c07cf0);
  }

  .score-ring {
    width: 110px; height: 110px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; position: relative; flex-shrink: 0;
  }

  .score-ring svg {
    position: absolute; inset: 0; width: 100%; height: 100%;
    transform: rotate(-90deg);
  }

  .score-ring-track { fill:none; stroke:rgba(255,255,255,0.06); stroke-width:6; }
  .score-ring-fill  {
    fill:none; stroke-width:6; stroke-linecap:round;
    stroke-dasharray: 283;
    transition: stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1);
  }

  .score-number {
    font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 700;
    line-height: 1; position: relative; z-index: 1;
  }
  .score-max {
    font-family: 'DM Mono', monospace; font-size: 10px;
    color: rgba(255,255,255,0.3); position: relative; z-index: 1; letter-spacing:.05em;
  }

  .score-right { display:flex; flex-direction:column; justify-content:center; gap:10px; }
  .score-eyebrow {
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.25);
  }
  .score-grade {
    font-size: 22px; font-weight: 600; letter-spacing: -0.3px;
  }
  .score-remark {
    font-size: 13px; line-height: 1.65; color: rgba(255,255,255,0.5);
    max-width: 480px;
  }

  @media (max-width: 560px) {
    .score-hero { grid-template-columns: 1fr; }
  }

  /* ── Section header ── */
  .sec-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
  }
  .sec-title {
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.3);
  }
  .sec-line {
    flex:1; height:1px; background:rgba(255,255,255,0.06);
  }

  /* ── Breakdown cards ── */
  .breakdown-list { display:flex; flex-direction:column; gap:16px; }

  .bd-card {
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.02);
    overflow: hidden;
    animation: fade-in 0.4s ease both;
  }

  .bd-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; cursor: pointer; gap: 12px;
    transition: background 0.2s;
  }
  .bd-header:hover { background: rgba(255,255,255,0.03); }

  .bd-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }

  .bd-qnum {
    font-family: 'DM Mono', monospace; font-size: 11px;
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.4); flex-shrink: 0; letter-spacing: 0;
  }

  .bd-q-preview {
    font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.75);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .bd-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }

  .bd-score-pill {
    font-family: 'DM Mono', monospace; font-size: 11px;
    padding: 4px 12px; border-radius: 20px; border: 1px solid; font-weight: 500;
  }

  .bd-topic {
    font-family: 'DM Mono', monospace; font-size: 10px;
    padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.3);
  }

  .bd-chevron {
    font-size: 12px; color: rgba(255,255,255,0.2);
    transition: transform 0.25s;
  }
  .bd-chevron.open { transform: rotate(180deg); }

  /* expanded body */
  .bd-body {
    padding: 0 20px 20px;
    display: flex; flex-direction: column; gap: 14px;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 16px;
    animation: fade-in 0.25s ease;
  }

  .bd-block { display:flex; flex-direction:column; gap:6px; }
  .bd-block-label {
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.22);
  }
  .bd-block-text {
    font-size: 13px; line-height: 1.65; color: rgba(255,255,255,0.6);
    padding: 12px 16px; border-radius: 12px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  }
  .bd-block-text.suggested {
    color: rgba(124,240,200,0.75);
    background: rgba(124,240,200,0.04); border-color: rgba(124,240,200,0.12);
  }
  .bd-block-text.remark {
    color: rgba(251,191,36,0.75);
    background: rgba(251,191,36,0.04); border-color: rgba(251,191,36,0.12);
  }

  /* ── Score bar helper ── */
  .score-bar-wrap { display:flex; align-items:center; gap:10px; margin-top:4px; }
  .score-bar-track {
    flex:1; height:4px; border-radius:99px; background:rgba(255,255,255,0.07); overflow:hidden;
  }
  .score-bar-fill {
    height:100%; border-radius:99px;
    transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
  }
  .score-bar-num {
    font-family:'DM Mono',monospace; font-size:11px;
    color:rgba(255,255,255,0.4); min-width:32px; text-align:right;
  }

  /* ── CTA footer ── */
  .fb-cta {
    display: flex; align-items: center; justify-content: center; gap: 14px;
    padding-top: 8px;
    flex-wrap: wrap;
  }

  .btn-retry {
    font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.08em; text-transform:uppercase;
    padding:11px 22px; border-radius:12px;
    border:1px solid rgba(255,255,255,0.1); background:transparent;
    color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.2s;
  }
  .btn-retry:hover { border-color:rgba(255,255,255,0.22); color:rgba(255,255,255,0.7); }

  .btn-dash-primary {
    font-family:'Sora',sans-serif; font-size:13px; font-weight:600;
    padding:12px 28px; border-radius:14px; border:none;
    background:linear-gradient(135deg,#7cf0c8,#5ad4a8);
    color:#07140f; cursor:pointer; transition:all 0.25s;
    display:flex; align-items:center; gap:8px;
    box-shadow:0 0 0 0 rgba(124,240,200,0.3);
  }
  .btn-dash-primary:hover {
    transform:translateY(-1px);
    box-shadow:0 8px 28px rgba(124,240,200,0.18), 0 0 0 1px rgba(124,240,200,0.3);
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
  const circumference = 283;
  return circumference - (score / 100) * circumference;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function FeedbackScreen() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const history   = (location.state as { history?: QAPair[] })?.history ?? [];

  const [feedback, setFeedback] = React.useState<FeedbackResult | null>(null);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<number | null>(0);

  React.useEffect(() => {
    if (!history.length) {
      // demo mode — fake some data
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
      <div className="fb-root">
        <div className="fb-glow" />

        {/* Header */}
        <header className="fb-header">
          <div className="fb-logo">prep<em>AI</em> · feedback</div>
          <div className="step-pills">
            <div className="step-pill done">01 · Prep</div>
            <div className="step-pill done">02 · Interview</div>
            <div className="step-pill active">03 · Feedback</div>
          </div>
          <button className="btn-dash" onClick={() => navigate("/dashboard")}>Dashboard</button>
        </header>

        <main className="fb-body">

          {/* Loading */}
          {loading && (
            <div className="fb-loading">
              <div className="fb-spinner" />
              <div className="fb-loading-text">Analysing your answers…</div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ textAlign:"center", color:"#f87171", fontFamily:"DM Mono, monospace", fontSize:13 }}>
              ⚠ {error}
            </div>
          )}

          {/* Feedback */}
          {!loading && feedback && (
            <>
              {/* Score hero */}
              <div className="score-hero" style={{ animationDelay:"0.05s" }}>
                <div className="score-ring">
                  <svg viewBox="0 0 100 100">
                    <circle className="score-ring-track" cx="50" cy="50" r="45" />
                    <circle
                      className="score-ring-fill"
                      cx="50" cy="50" r="45"
                      stroke={scoreColor(feedback.overallScore)}
                      strokeDashoffset={ringOffset(feedback.overallScore)}
                    />
                  </svg>
                  <span className="score-number" style={{ color:scoreColor(feedback.overallScore) }}>
                    {feedback.overallScore}
                  </span>
                  <span className="score-max">/100</span>
                </div>

                <div className="score-right">
                  <div className="score-eyebrow">Overall Score</div>
                  <div className="score-grade" style={{ color:scoreColor(feedback.overallScore) }}>
                    {scoreGrade(feedback.overallScore)}
                  </div>
                  <div className="score-remark">{feedback.overallRemark}</div>
                </div>
              </div>

              {/* Per-question breakdown */}
              <div>
                <div className="sec-header">
                  <span className="sec-title">Question breakdown</span>
                  <div className="sec-line" />
                </div>

                <div className="breakdown-list">
                  {feedback.breakdown.map((item, i) => {
                    const isOpen = expanded === i;
                    const sc = scoreColor(item.score);
                    return (
                      <div
                        key={i}
                        className="bd-card"
                        style={{ animationDelay: `${0.08 * i}s` }}
                      >
                        <div className="bd-header" onClick={() => setExpanded(isOpen ? null : i)}>
                          <div className="bd-left">
                            <div className="bd-qnum">Q{i + 1}</div>
                            <div className="bd-q-preview">{item.question}</div>
                          </div>
                          <div className="bd-right">
                            <span className="bd-topic">{item.topic}</span>
                            <span
                              className="bd-score-pill"
                              style={{ color:sc, borderColor:`${sc}33`, background:`${sc}0d` }}
                            >
                              {item.score}
                            </span>
                            <span className={`bd-chevron ${isOpen ? "open" : ""}`}>▾</span>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="bd-body">
                            {/* Score bar */}
                            <div className="score-bar-wrap">
                              <div className="score-bar-track">
                                <div
                                  className="score-bar-fill"
                                  style={{ width:`${item.score}%`, background:sc }}
                                />
                              </div>
                              <div className="score-bar-num">{item.score}/100</div>
                            </div>

                            <div className="bd-block">
                              <div className="bd-block-label">Your answer</div>
                              <div className="bd-block-text">{item.answer}</div>
                            </div>

                            <div className="bd-block">
                              <div className="bd-block-label">Feedback</div>
                              <div className="bd-block-text remark">{item.remark}</div>
                            </div>

                            <div className="bd-block">
                              <div className="bd-block-label">Suggested answer</div>
                              <div className="bd-block-text suggested">{item.suggestedAnswer}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="fb-cta">
                <button className="btn-retry" onClick={() => navigate("/mock-interview")}>
                  Try again ↺
                </button>
                <button className="btn-dash-primary" onClick={() => navigate("/dashboard")}>
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