import * as React from "react";
import { useNavigate } from "react-router-dom";

import {
  generateAllQuestions,
  type QuestionItem,
  speakText,
  createSTT,
  type QAPair,
} from "../lib/interviewEngine";

// ─── Minimal style block: only what Tailwind can't express ────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Sora:wght@300;400;500;600;700&display=swap');

  .font-sora  { font-family: 'Sora', sans-serif; }
  .font-mono  { font-family: 'DM Mono', monospace; }

  /* Grid background */
  .mi-grid-bg::before {
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

  /* Avatar rings animate only when parent card is .speaking */
  .v-card.speaking .ring-pulse.r1 {
    border-color: rgba(124,240,200,0.5);
    animation: ring-expand 1.8s ease-out infinite;
  }
  .v-card.speaking .ring-pulse.r2 {
    border-color: rgba(124,240,200,0.3);
    animation: ring-expand 1.8s ease-out 0.5s infinite;
  }
  .v-card.user-card.speaking .ring-pulse.r1 {
    border-color: rgba(167,139,250,0.5);
    animation: ring-expand 1.8s ease-out infinite;
  }
  .v-card.user-card.speaking .ring-pulse.r2 {
    border-color: rgba(167,139,250,0.3);
    animation: ring-expand 1.8s ease-out 0.5s infinite;
  }
  @keyframes ring-expand {
    0%   { opacity: .9; transform: scale(.95); }
    100% { opacity: 0;  transform: scale(1.6); }
  }

  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.4; transform:scale(.7); }
  }
  .animate-pulse-dot { animation: pulse-dot 1.8s ease-in-out infinite; }

  @keyframes blink {
    0%,100% { opacity:1; }
    50%     { opacity:0; }
  }
  .animate-blink { animation: blink 1s step-end infinite; }

  @keyframes spin-slow { to { transform: rotate(360deg); } }
  .animate-spin-slow { animation: spin-slow 1s linear infinite; }

  @keyframes fade-up {
    from { opacity:0; transform:translateY(4px); }
    to   { opacity:1; transform:none; }
  }
  .animate-fade-up { animation: fade-up 0.3s ease; }

  @keyframes mic-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.3); }
    50%     { box-shadow: 0 0 0 8px rgba(248,113,113,0); }
  }
  .animate-mic-pulse { animation: mic-pulse 1.2s ease-in-out infinite; }

  /* Speaking glow borders */
  .glow-ai   { box-shadow: 0 0 0 2px #7cf0c8, 0 0 28px rgba(124,240,200,0.12); }
  .glow-user { box-shadow: 0 0 0 2px #a78bfa, 0 0 28px rgba(167,139,250,0.12); }

  /* Subtitle top gradient bar */
  .subtitle-bar::before {
    content: '';
    position: absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, #7cf0c8, #7c9df0, #c07cf0);
  }

  /* Progress gradient fill */
  .progress-fill {
    background: linear-gradient(90deg, #7cf0c8, #7c9df0);
    transition: width 0.6s ease;
  }

  /* AI avatar bg */
  .avatar-ai   { background: linear-gradient(135deg,#1a2a3a,#0d1f2d); border: 2px solid rgba(124,240,200,0.3); }
  .avatar-user { background: linear-gradient(135deg,#1e1a2e,#120f20); border: 2px solid rgba(167,139,250,0.3); }
`;

// ─── Interview phases ──────────────────────────────────────────────────────
type Phase = "generating" | "speaking" | "listening" | "processing" | "done";
const TOTAL_QUESTIONS = 5;

// ─── Component ────────────────────────────────────────────────────────────
export default function MockInterview() {
  const navigate = useNavigate();

  const [phase, setPhase]           = React.useState<Phase>("generating");
  const [questions, setQuestions]   = React.useState<QuestionItem[]>([]);
  const [qIndex, setQIndex]         = React.useState(0);
  const [history, setHistory]       = React.useState<QAPair[]>([]);
  const [currentQ, setCurrentQ]     = React.useState<{ question: string; topic: string } | null>(null);
  const [displayedQ, setDisplayedQ] = React.useState("");
  const [typingQ, setTypingQ]       = React.useState(false);
  const [liveTranscript, setLive]   = React.useState("");
  const [finalAnswer, setFinal]     = React.useState("");
  const [error, setError]           = React.useState<string | null>(null);
  const [muted, setMuted]           = React.useState(false);

  const sttRef       = React.useRef<{ start:()=>void; stop:()=>void } | null>(null);
  const answerRef    = React.useRef("");
  const questionsRef = React.useRef<QuestionItem[]>([]);
  const userVideoRef = React.useRef<HTMLVideoElement>(null);       // ← camera
  const camStreamRef = React.useRef<MediaStream | null>(null);    // ← camera

  // ── Typewriter ──
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

  async function askQuestion(idx: number, qs: QuestionItem[]) {
    const q = qs[idx];
    if (!q) return;

    setCurrentQ({ question: q.question, topic: q.topic });
    setDisplayedQ("");
    setLive("");
    setFinal("");
    setError(null);
    answerRef.current = "";

    try {
      setPhase("speaking");
      await speakText(q.question);

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
        () => {}
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
      setPhase("done");
      setTimeout(() => navigate("/mock-feedback", { state: { history: updated } }), 800);
    } else {
      setQIndex(nextIdx);
      setTimeout(() => askQuestion(nextIdx, questionsRef.current), 600);
    }
  }

  const hasBooted = React.useRef(false);
  React.useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    // ── Start camera (silent fallback if denied) ──
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        camStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.play();
        }
      })
      .catch(() => {});

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
    return () => {
      sttRef.current?.stop();
      camStreamRef.current?.getTracks().forEach((t) => t.stop());  // ← camera cleanup
    };
  }, []);

  // ── Derived ──
  const questionNumber = qIndex + 1;
  const progressPct    = Math.round((qIndex / TOTAL_QUESTIONS) * 100);
  const aiSpeaking     = phase === "speaking";
  const userSpeaking   = phase === "listening";

  function phaseLabel() {
    if (phase === "generating")  return { cls: "loading",   icon: "⟳", text: "Loading all questions…" };
    if (phase === "speaking")    return { cls: "speaking",  icon: "🔊", text: "AI is speaking…" };
    if (phase === "listening")   return { cls: "listening", icon: "🎙️", text: "Recording your answer — click Done when finished" };
    if (phase === "processing")  return { cls: "loading",   icon: "⟳", text: "Processing…" };
    if (phase === "done")        return { cls: "done",       icon: "✅", text: "Interview complete! Generating feedback…" };
    return null;
  }

  const banner = phaseLabel();

  // Banner color map
  const bannerColors: Record<string, string> = {
    loading:   "bg-[rgba(124,140,240,0.07)] border-[rgba(124,140,240,0.2)] text-[rgba(124,140,240,0.85)]",
    speaking:  "bg-[rgba(124,240,200,0.07)] border-[rgba(124,240,200,0.2)] text-[rgba(124,240,200,0.85)]",
    listening: "bg-[rgba(248,113,113,0.07)] border-[rgba(248,113,113,0.2)] text-[rgba(248,113,113,0.85)]",
    done:      "bg-[rgba(251,191,36,0.07)]  border-[rgba(251,191,36,0.2)]  text-[rgba(251,191,36,0.85)]",
  };

  return (
    <>
      <style>{styles}</style>

      {/* Root */}
      <div className="mi-grid-bg font-sora relative flex flex-col min-h-screen bg-[#0a0a0f] text-[#e8e8f0] overflow-hidden">

        {/* ── Header ── */}
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-7 py-4 border-b border-white/[0.06] bg-[rgba(10,10,15,0.9)] backdrop-blur-md">
          {/* Logo */}
          <div className="font-mono text-xs tracking-widest uppercase text-white/35">
            prep<span className="text-[#7cf0c8] not-italic">AI</span> · interview
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2.5 flex-1 max-w-xs mx-auto">
            <div className="flex-1 h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
              <div className="progress-fill h-full rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="font-mono text-[10px] text-white/30 tracking-wide whitespace-nowrap">
              Q{Math.min(questionNumber, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}
            </div>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase text-white/40">
            <span className="animate-pulse-dot w-[7px] h-[7px] rounded-full bg-red-400 inline-block" />
            Live
          </div>

          {/* Exit */}
          <button
            onClick={() => { sttRef.current?.stop(); camStreamRef.current?.getTracks().forEach(t => t.stop()); navigate("/dashboard"); }}
            className="font-mono text-[11px] tracking-wide uppercase px-4 py-[7px] rounded-lg border border-white/10 bg-transparent text-white/30 cursor-pointer transition-all hover:border-white/20 hover:text-white/60"
          >
            ← Exit
          </button>
        </header>

        {/* ── Body ── */}
        <main className="relative z-[1] flex-1 flex flex-col gap-[18px] px-7 py-6 max-w-[1100px] w-full mx-auto">

          {/* ── Video row ── */}
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">

            {/* AI card */}
            <div className={`v-card relative rounded-[20px] overflow-hidden bg-[#0e0e18] border border-white/[0.07] aspect-[16/10] flex items-center justify-center transition-shadow duration-400 ${aiSpeaking ? "speaking glow-ai" : ""}`}>
              <div className="flex flex-col items-center gap-3">
                <div className={`avatar-ai relative w-[68px] h-[68px] rounded-full flex items-center justify-center text-[30px]`}>
                  <div className="ring-pulse r1 absolute inset-[-6px] rounded-full border-[1.5px] opacity-0" />
                  <div className="ring-pulse r2 absolute inset-[-6px] rounded-full border-[1.5px] opacity-0" />
                  🤖
                </div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/30">AI Interviewer</div>
              </div>
              {/* Nametag */}
              <div className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.07em] px-[11px] py-1 rounded-lg bg-black/60 backdrop-blur border border-white/[0.07] text-white/55 flex items-center gap-1.5">
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0 bg-[#7cf0c8]" />
                Aria · AI
              </div>
              {/* Status */}
              <div className={`absolute top-3 right-3 font-mono text-[10px] px-2.5 py-1 rounded-full bg-black/55 border transition-all duration-300 tracking-[0.06em] ${aiSpeaking ? "text-[#7cf0c8] border-[rgba(124,240,200,0.3)]" : "border-white/[0.07] text-white/40"}`}>
                {aiSpeaking ? "Speaking" : phase === "generating" ? "Thinking…" : "Idle"}
              </div>
            </div>

            {/* User card — live camera feed */}
            <div className={`v-card user-card relative rounded-[20px] overflow-hidden bg-[#0e0e18] border border-white/[0.07] aspect-[16/10] flex items-center justify-center transition-shadow duration-400 ${userSpeaking ? "speaking glow-user" : ""}`}>
              {/* Live camera — fills the card */}
              <video
                ref={userVideoRef}
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Emoji fallback — sits behind video, visible only if camera denied
              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className="avatar-user relative w-[68px] h-[68px] rounded-full flex items-center justify-center text-[30px]">
                  <div className="ring-pulse r1 absolute inset-[-6px] rounded-full border-[1.5px] opacity-0" />
                  <div className="ring-pulse r2 absolute inset-[-6px] rounded-full border-[1.5px] opacity-0" />
                  🧑‍💻
                </div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/30">You</div>
              </div> */}
              {/* Nametag */}
              <div className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.07em] px-[11px] py-1 rounded-lg bg-black/60 backdrop-blur border border-white/[0.07] text-white/55 flex items-center gap-1.5">
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0 bg-[#a78bfa]" />
                You
              </div>
              {/* Status */}
              <div className={`absolute top-3 right-3 font-mono text-[10px] px-2.5 py-1 rounded-full bg-black/55 border transition-all duration-300 tracking-[0.06em] ${userSpeaking ? "text-red-400 border-red-400/30" : "border-white/[0.07] text-white/40"}`}>
                {userSpeaking ? "● Recording" : "Waiting"}
              </div>
            </div>
          </div>

          {/* ── State banner ── */}
          {banner && (
            <div className={`animate-fade-up flex items-center gap-2.5 px-[18px] py-3 rounded-xl text-xs border ${bannerColors[banner.cls] ?? ""}`}>
              <span className={banner.icon === "⟳" ? "animate-spin-slow" : ""}>{banner.icon}</span>
              <span>{error || banner.text}</span>
            </div>
          )}

          {/* ── Subtitle box ── */}
          <div className="subtitle-bar relative rounded-2xl bg-[#0e0e18] border border-white/[0.07] px-6 py-5 min-h-[100px] flex flex-col gap-2.5 overflow-hidden">
            {/* Meta row */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/20">Live transcript</span>
              {currentQ && (
                <span className={`font-mono text-[10px] tracking-[0.08em] px-2.5 py-[3px] rounded-full ${phase === "listening" ? "text-[#a78bfa] bg-[rgba(167,139,250,0.08)] border border-[rgba(167,139,250,0.2)]" : "text-[#7cf0c8] bg-[rgba(124,240,200,0.08)] border border-[rgba(124,240,200,0.2)]"}`}>
                  {phase === "listening" ? "You" : "Aria · AI"}
                </span>
              )}
            </div>

            {/* AI question (typewriter) */}
            {(phase === "speaking" || phase === "listening" || phase === "processing" || phase === "done") && displayedQ ? (
              <div className="flex items-center text-[15px] leading-[1.65] text-white/[0.82] min-h-[48px]">
                {displayedQ}{typingQ && <span className="animate-blink inline-block w-[2px] h-[1em] bg-[#7cf0c8] ml-[3px] align-middle rounded-[1px]" />}
              </div>
            ) : phase === "generating" ? (
              <div className="flex items-center text-[13px] min-h-[48px] text-white/20 italic">Generating your question…</div>
            ) : (
              <div className="flex items-center text-[13px] min-h-[48px] text-white/20 italic">Waiting…</div>
            )}

            {/* User live transcript */}
            {phase === "listening" && (finalAnswer || liveTranscript) && (
              <div className="text-[13px] text-[rgba(167,139,250,0.5)] italic mt-1">
                {finalAnswer && <span className="text-[rgba(167,139,250,0.75)] not-italic">{finalAnswer} </span>}
                {liveTranscript && <span>{liveTranscript}</span>}
              </div>
            )}
          </div>

          {/* ── Controls ── */}
          <div className="flex items-center justify-center gap-3 pb-1.5">
            {/* Mic / mute */}
            <button
              onClick={() => setMuted(v => !v)}
              title={muted ? "Unmute" : "Mute"}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg border border-white/10 bg-white/[0.04] cursor-pointer transition-all hover:bg-white/[0.09] hover:scale-105 ${phase === "listening" ? "animate-mic-pulse bg-[rgba(248,113,113,0.15)] border-[rgba(248,113,113,0.35)]" : ""}`}
            >
              {muted ? "🔇" : "🎤"}
            </button>

            {/* Done answering */}
            <button
              disabled={phase !== "listening"}
              onClick={handleDoneAnswering}
              className="font-mono text-[11px] tracking-[0.08em] px-5 py-2.5 rounded-xl border border-white/10 bg-transparent text-white/40 cursor-pointer transition-all hover:border-white/20 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {qIndex + 1 >= TOTAL_QUESTIONS ? "Finish interview →" : "Done answering →"}
            </button>

            {/* End session */}
            <button
              onClick={() => { sttRef.current?.stop(); camStreamRef.current?.getTracks().forEach(t => t.stop()); navigate("/dashboard"); }}
              title="End session"
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl border border-red-400/30 bg-[rgba(248,113,113,0.12)] cursor-pointer transition-all hover:bg-[rgba(248,113,113,0.25)] hover:border-red-400/55"
            >
              📵
            </button>
          </div>

        </main>
      </div>
    </>
  );
}