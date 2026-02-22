import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  generateAllQuestions,
  type QuestionItem,
  speakText,
  createSTT,
  type QAPair,
} from "../lib/interviewEngine";

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .mi-root {
    min-height: 100vh;
    background: #0a0a0f;
    color: #e8e8f0;
    font-family: 'Sora', sans-serif;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .mi-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 52px 52px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Header ── */
  .mi-header {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 28px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(10,10,15,0.9);
    backdrop-filter: blur(12px);
    flex-wrap: wrap; gap: 12px;
  }

  .mi-logo {
    font-family: 'DM Mono', monospace;
    font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(255,255,255,0.35);
  }
  .mi-logo em { color: #7cf0c8; font-style: normal; }

  .mi-progress-wrap {
    display: flex; align-items: center; gap: 10px;
    flex: 1; max-width: 320px; margin: 0 auto;
  }

  .mi-progress-track {
    flex: 1; height: 3px; border-radius: 99px;
    background: rgba(255,255,255,0.07);
    overflow: hidden;
  }
  .mi-progress-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, #7cf0c8, #7c9df0);
    transition: width 0.6s ease;
  }

  .mi-q-counter {
    font-family: 'DM Mono', monospace; font-size: 10px;
    color: rgba(255,255,255,0.3); letter-spacing: 0.1em; white-space: nowrap;
  }

  .live-badge {
    display: flex; align-items: center; gap: 6px;
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.4);
  }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #f87171;
    animation: pulse-dot 1.8s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:.4; transform:scale(.7); }
  }

  .btn-exit {
    font-family: 'DM Mono', monospace; font-size: 11px;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 7px 16px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; color: rgba(255,255,255,0.3);
    cursor: pointer; transition: all 0.2s;
  }
  .btn-exit:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.6); }

  /* ── Body ── */
  .mi-body {
    position: relative; z-index: 1;
    flex: 1; display: flex; flex-direction: column;
    gap: 18px; padding: 24px 28px;
    max-width: 1100px; width: 100%; margin: 0 auto;
  }

  /* ── Video row ── */
  .video-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  @media (max-width: 640px) { .video-row { grid-template-columns: 1fr; } }

  .v-card {
    position: relative; border-radius: 20px; overflow: hidden;
    aspect-ratio: 16/10; background: #0e0e18;
    border: 1px solid rgba(255,255,255,0.07);
    transition: box-shadow 0.4s;
    display: flex; align-items: center; justify-content: center;
  }
  .v-card.speaking {
    box-shadow: 0 0 0 2px #7cf0c8, 0 0 28px rgba(124,240,200,0.12);
  }
  .v-card.user-card.speaking {
    box-shadow: 0 0 0 2px #a78bfa, 0 0 28px rgba(167,139,250,0.12);
  }

  .v-inner { display:flex; flex-direction:column; align-items:center; gap:12px; }

  .avatar-ring {
    width: 68px; height: 68px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    position: relative; font-size: 30px;
  }
  .avatar-ring.ai   { background:linear-gradient(135deg,#1a2a3a,#0d1f2d); border:2px solid rgba(124,240,200,0.3); }
  .avatar-ring.user { background:linear-gradient(135deg,#1e1a2e,#120f20); border:2px solid rgba(167,139,250,0.3); }

  .ring-pulse { position:absolute; inset:-6px; border-radius:50%; border:1.5px solid; opacity:0; }
  .v-card.speaking     .ring-pulse.r1 { border-color:rgba(124,240,200,0.5); animation:ring-expand 1.8s ease-out infinite; }
  .v-card.speaking     .ring-pulse.r2 { border-color:rgba(124,240,200,0.3); animation:ring-expand 1.8s ease-out 0.5s infinite; }
  .v-card.user-card.speaking .ring-pulse.r1 { border-color:rgba(167,139,250,0.5); animation:ring-expand 1.8s ease-out infinite; }
  .v-card.user-card.speaking .ring-pulse.r2 { border-color:rgba(167,139,250,0.3); animation:ring-expand 1.8s ease-out .5s infinite; }
  @keyframes ring-expand {
    0%   { opacity:.9; transform:scale(.95); }
    100% { opacity:0;  transform:scale(1.6); }
  }

  .v-label {
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3);
  }

  .v-nametag {
    position: absolute; bottom: 12px; left: 12px;
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.07em; padding: 4px 11px; border-radius: 8px;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.55);
    display: flex; align-items: center; gap: 6px;
  }
  .v-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

  .v-status {
    position: absolute; top: 12px; right: 12px;
    font-family: 'DM Mono', monospace; font-size: 10px;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.4); letter-spacing: 0.06em;
    transition: all 0.3s;
  }
  .v-status.active { color: #7cf0c8; border-color: rgba(124,240,200,0.3); }
  .v-status.recording { color: #f87171; border-color: rgba(248,113,113,0.3); }

  /* ── Subtitle ── */
  .subtitle-box {
    border-radius: 16px; background: #0e0e18;
    border: 1px solid rgba(255,255,255,0.07);
    padding: 20px 24px; min-height: 100px;
    display: flex; flex-direction: column; gap: 10px;
    position: relative; overflow: hidden;
  }
  .subtitle-box::before {
    content: '';
    position: absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, #7cf0c8, #7c9df0, #c07cf0);
  }
  .sub-meta {
    display: flex; align-items: center; justify-content: space-between;
  }
  .sub-label {
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.2);
  }
  .sub-speaker {
    font-family: 'DM Mono', monospace; font-size: 10px;
    letter-spacing: 0.08em; padding: 3px 10px; border-radius: 20px;
  }
  .sub-speaker.ai   { color:#7cf0c8; background:rgba(124,240,200,0.08); border:1px solid rgba(124,240,200,0.2); }
  .sub-speaker.user { color:#a78bfa; background:rgba(167,139,250,0.08); border:1px solid rgba(167,139,250,0.2); }

  .sub-text {
    font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.82);
    min-height: 48px; display: flex; align-items: center;
  }
  .sub-text.idle { color:rgba(255,255,255,0.18); font-style:italic; font-size:13px; }

  .cursor {
    display:inline-block; width:2px; height:1em;
    background:#7cf0c8; margin-left:3px; vertical-align:middle;
    border-radius:1px; animation:blink 1s step-end infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* interim (live user speech) */
  .sub-interim { font-size:13px; color:rgba(167,139,250,0.5); font-style:italic; margin-top:4px; }

  /* ── State banner ── */
  .state-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 18px; border-radius: 12px;
    font-size: 12px; animation: fade-in 0.3s ease;
    border: 1px solid;
  }
  @keyframes fade-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
  .state-banner.loading  { background:rgba(124,140,240,0.07); border-color:rgba(124,140,240,0.2); color:rgba(124,140,240,0.85); }
  .state-banner.speaking { background:rgba(124,240,200,0.07); border-color:rgba(124,240,200,0.2); color:rgba(124,240,200,0.85); }
  .state-banner.listening{ background:rgba(248,113,113,0.07); border-color:rgba(248,113,113,0.2); color:rgba(248,113,113,0.85); }
  .state-banner.done     { background:rgba(251,191,36,0.07);  border-color:rgba(251,191,36,0.2);  color:rgba(251,191,36,0.85); }

  .spin { animation: spin 1s linear infinite; display:inline-block; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* ── Controls ── */
  .mi-controls {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    padding-bottom: 6px;
  }

  .ctrl {
    width:48px; height:48px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:18px; cursor:pointer;
    border:1px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.04);
    transition:all 0.2s;
  }
  .ctrl:hover { background:rgba(255,255,255,0.09); transform:scale(1.07); }
  .ctrl:disabled { opacity:0.3; cursor:not-allowed; transform:none; }

  .ctrl-skip {
    font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.08em;
    padding:10px 20px; border-radius:12px;
    border:1px solid rgba(255,255,255,0.1); background:transparent;
    color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.2s;
  }
  .ctrl-skip:hover { border-color:rgba(255,255,255,0.2); color:rgba(255,255,255,0.7); }
  .ctrl-skip:disabled { opacity:0.3; cursor:not-allowed; }

  .ctrl-end {
    width:56px; height:56px; font-size:20px;
    background:rgba(248,113,113,0.12); border-color:rgba(248,113,113,0.3);
  }
  .ctrl-end:hover { background:rgba(248,113,113,0.25) !important; border-color:rgba(248,113,113,0.55) !important; }

  /* mic pulse while recording */
  .ctrl-mic.recording {
    background:rgba(248,113,113,0.15); border-color:rgba(248,113,113,0.35);
    animation: mic-pulse 1.2s ease-in-out infinite;
  }
  @keyframes mic-pulse {
    0%,100%{ box-shadow:0 0 0 0 rgba(248,113,113,0.3); }
    50%    { box-shadow:0 0 0 8px rgba(248,113,113,0); }
  }
`;

// ─── Interview phases ──────────────────────────────────────────────────────

type Phase =
  | "generating"   // calling Gemini
  | "speaking"     // ElevenLabs playing
  | "listening"    // STT active
  | "processing"   // saving answer, looping
  | "done";        // all questions answered

const TOTAL_QUESTIONS = 5;

// ─── Component ────────────────────────────────────────────────────────────

export default function MockInterview() {
  const navigate = useNavigate();

  const [phase, setPhase]           = React.useState<Phase>("generating");
  const [questions, setQuestions]   = React.useState<QuestionItem[]>([]);  // all Qs loaded upfront
  const [qIndex, setQIndex]         = React.useState(0);                   // which Q we're on
  const [history, setHistory]       = React.useState<QAPair[]>([]);
  const [currentQ, setCurrentQ]     = React.useState<{ question: string; topic: string } | null>(null);
  const [displayedQ, setDisplayedQ] = React.useState("");   // typewriter
  const [typingQ, setTypingQ]       = React.useState(false);
  const [liveTranscript, setLive]   = React.useState("");   // interim STT
  const [finalAnswer, setFinal]     = React.useState("");   // confirmed STT
  const [error, setError]           = React.useState<string | null>(null);
  const [muted, setMuted]           = React.useState(false);

  const sttRef    = React.useRef<{ start:()=>void; stop:()=>void } | null>(null);
  const answerRef = React.useRef(""); // accumulates final STT across utterances
  const questionsRef = React.useRef<QuestionItem[]>([]); // stable ref for async access

  // ── Typewriter for question ──────────────────────────────────────────────
  React.useEffect(() => {
    if (!currentQ) return;
    setDisplayedQ("");
    setTypingQ(true);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayedQ(currentQ.question.slice(0, i));
      if (i >= currentQ.question.length) { clearInterval(iv); setTypingQ(false); }
    }, 22);
    return () => clearInterval(iv);
  }, [currentQ]);

  // ── Ask a specific question by index (no more Gemini calls after boot) ────
  async function askQuestion(idx: number, qs: QuestionItem[]) {
    console.log("askQuestion called:", idx, qs[idx]?.question);
    const q = qs[idx];
    if (!q) return;

    setCurrentQ({ question: q.question, topic: q.topic });
    setDisplayedQ("");
    setLive("");
    setFinal("");
    setError(null);
    answerRef.current = "";

    try {
      // 1. Speak via ElevenLabs
      setPhase("speaking");
      await speakText(q.question);
      console.log("speakText called for:", q.question);


      // 2. Listen via STT
      setPhase("listening");
      sttRef.current = createSTT(
        (text, isFinal) => {
          if (isFinal) {
            answerRef.current += (answerRef.current ? " " : "") + text;
            setFinal(answerRef.current);
            setLive("");
          } else {
            setLive(text);
          }
        },
        () => {
          // STT ended naturally — user clicks Done to advance
        }
      );
      sttRef.current.start();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setPhase("processing");
    }
  }

  function handleDoneAnswering() {
    sttRef.current?.stop();
    const answer = answerRef.current.trim() || "(no answer)";
    const updated: QAPair[] = [
      ...history,
      { question: currentQ!.question, topic: currentQ!.topic, answer },
    ];
    setHistory(updated);
    setPhase("processing");

    const nextIdx = qIndex + 1;

    if (nextIdx >= questionsRef.current.length) {
      // All done — go to feedback
      setPhase("done");
      setTimeout(() => navigate("/mock-feedback", { state: { history: updated } }), 800);
    } else {
      setQIndex(nextIdx);
      setTimeout(() => askQuestion(nextIdx, questionsRef.current), 600);
    }
  }

  // ── Boot: ONE Gemini call to load all questions, then start ───────────────
  React.useEffect(() => {
    setPhase("generating");
    generateAllQuestions(TOTAL_QUESTIONS)
      .then((qs) => {
        setQuestions(qs);
        questionsRef.current = qs;
        askQuestion(0, qs);
      })
      .catch((e: any) => {
        setError(e?.message ?? "Failed to load questions");
        setPhase("processing");
      });
    return () => { sttRef.current?.stop(); };
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const questionNumber  = qIndex + 1;
  const progressPct     = Math.round((qIndex / TOTAL_QUESTIONS) * 100);
  const aiSpeaking      = phase === "speaking";
  const userSpeaking    = phase === "listening";

  function phaseLabel() {
    if (phase === "generating")  return { cls:"loading",   icon:"⟳", text:"Loading all questions… (1 API call)" };
    if (phase === "speaking")    return { cls:"speaking",  icon:"🔊", text:"AI is speaking…" };
    if (phase === "listening")   return { cls:"listening", icon:"🎙️", text:"Recording your answer — click Done when finished" };
    if (phase === "processing")  return { cls:"loading",   icon:"⟳", text:"Processing…" };
    if (phase === "done")        return { cls:"done",      icon:"✅", text:"Interview complete! Generating feedback…" };
    return null;
  }

  const banner = phaseLabel();

  return (
    <>
      <style>{styles}</style>
      <div className="mi-root">
        {/* Header */}
        <header className="mi-header">
          <div className="mi-logo">prep<em>AI</em> · interview</div>

          <div className="mi-progress-wrap">
            <div className="mi-progress-track">
              <div className="mi-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mi-q-counter">Q{Math.min(questionNumber, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</div>
          </div>

          <div className="live-badge">
            <span className="live-dot" />
            Live
          </div>

          <button className="btn-exit" onClick={() => { sttRef.current?.stop(); navigate("/dashboard"); }}>
            ← Exit
          </button>
        </header>

        {/* Body */}
        <main className="mi-body">

          {/* Video cards */}
          <div className="video-row">
            {/* AI */}
            <div className={`v-card ${aiSpeaking ? "speaking" : ""}`}>
              <div className="v-inner">
                <div className={`avatar-ring ai ${aiSpeaking ? "speaking" : ""}`}>
                  <div className="ring-pulse r1" />
                  <div className="ring-pulse r2" />
                  🤖
                </div>
                <div className="v-label">AI Interviewer</div>
              </div>
              <div className="v-nametag">
                <span className="v-dot" style={{ background:"#7cf0c8" }} />
                Aria · AI
              </div>
              <div className={`v-status ${aiSpeaking ? "active" : ""}`}>
                {aiSpeaking ? "Speaking" : phase === "generating" ? "Thinking…" : "Idle"}
              </div>
            </div>

            {/* User */}
            <div className={`v-card user-card ${userSpeaking ? "speaking" : ""}`}>
              <div className="v-inner">
                <div className={`avatar-ring user ${userSpeaking ? "speaking" : ""}`}>
                  <div className="ring-pulse r1" />
                  <div className="ring-pulse r2" />
                  🧑‍💻
                </div>
                <div className="v-label">You</div>
              </div>
              <div className="v-nametag">
                <span className="v-dot" style={{ background:"#a78bfa" }} />
                You
              </div>
              <div className={`v-status ${userSpeaking ? "recording" : ""}`}>
                {userSpeaking ? "● Recording" : "Waiting"}
              </div>
            </div>
          </div>

          {/* State banner */}
          {banner && (
            <div className={`state-banner ${banner.cls}`}>
              <span className={banner.icon === "⟳" ? "spin" : ""}>{banner.icon}</span>
              <span>{error || banner.text}</span>
            </div>
          )}

          {/* Subtitle */}
          <div className="subtitle-box">
            <div className="sub-meta">
              <span className="sub-label">Live transcript</span>
              {currentQ && (
                <span className={`sub-speaker ${phase === "listening" ? "user" : "ai"}`}>
                  {phase === "listening" ? "You" : "Aria · AI"}
                </span>
              )}
            </div>

            {/* AI question (typewriter) */}
            {(phase === "speaking" || phase === "listening" || phase === "processing" || phase === "done") && displayedQ ? (
              <div className="sub-text">
                {displayedQ}{typingQ && <span className="cursor" />}
              </div>
            ) : phase === "generating" ? (
              <div className="sub-text idle">Generating your question…</div>
            ) : (
              <div className="sub-text idle">Waiting…</div>
            )}

            {/* User live transcript */}
            {phase === "listening" && (finalAnswer || liveTranscript) && (
              <div className="sub-interim">
                {finalAnswer && <span style={{ color:"rgba(167,139,250,0.75)", fontStyle:"normal" }}>{finalAnswer} </span>}
                {liveTranscript && <span>{liveTranscript}</span>}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mi-controls">
            <button
              className={`ctrl ctrl-mic ${phase === "listening" ? "recording" : ""}`}
              title={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted(v => !v)}
            >
              {muted ? "🔇" : "🎤"}
            </button>

            {/* Done answering */}
            <button
              className="ctrl-skip"
              disabled={phase !== "listening"}
              onClick={handleDoneAnswering}
            >
              {qIndex + 1 >= TOTAL_QUESTIONS ? "Finish interview →" : "Done answering →"}
            </button>

            <button
              className="ctrl ctrl-end"
              title="End session"
              onClick={() => { sttRef.current?.stop(); navigate("/dashboard"); }}
            >
              📵
            </button>
          </div>

        </main>
      </div>
    </>
  );
}