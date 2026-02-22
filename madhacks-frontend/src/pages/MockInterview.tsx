import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Bot, User, Mic, MicOff, PhoneOff } from "lucide-react";

import {
  generateAllQuestions,
  type QuestionItem,
  speakText,
  cancelSpeech,
  createSTT,
  type QAPair,
} from "../lib/interviewEngine";

const styles = `
  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.4; transform:scale(.7); }
  }
  .animate-pulse-dot { animation: pulse-dot 1.8s ease-in-out infinite; }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .animate-blink { animation: blink 1s step-end infinite; }

  @keyframes spin-slow { to { transform:rotate(360deg); } }
  .animate-spin-slow { animation: spin-slow 1s linear infinite; }

  @keyframes mic-pulse {
    0%,100%{ box-shadow:0 0 0 0 rgba(248,113,113,0.3); }
    50%    { box-shadow:0 0 0 8px rgba(248,113,113,0); }
  }
  .animate-mic-pulse { animation: mic-pulse 1.2s ease-in-out infinite; }

  .glow-ai   { box-shadow: 0 0 0 2px #7aecc4, 0 0 24px rgba(122,236,196,0.1); }
  .glow-user { box-shadow: 0 0 0 2px #f87171, 0 0 24px rgba(248,113,113,0.1); }

  .v-card.speaking .ring-pulse.r1 { border-color:rgba(122,236,196,0.5); animation:ring-expand 1.8s ease-out infinite; }
  .v-card.speaking .ring-pulse.r2 { border-color:rgba(122,236,196,0.3); animation:ring-expand 1.8s ease-out 0.5s infinite; }
  .v-card.user-card.speaking .ring-pulse.r1 { border-color:rgba(248,113,113,0.5); animation:ring-expand 1.8s ease-out infinite; }
  .v-card.user-card.speaking .ring-pulse.r2 { border-color:rgba(248,113,113,0.3); animation:ring-expand 1.8s ease-out 0.5s infinite; }
  @keyframes ring-expand {
    0%  { opacity:.9; transform:scale(.95); }
    100%{ opacity:0;  transform:scale(1.6); }
  }

  /* Static user card — subtle ambient glow background */
  .user-card-bg {
    background:
      radial-gradient(ellipse at 30% 40%, rgba(248,113,113,0.06) 0%, transparent 60%),
      radial-gradient(ellipse at 70% 70%, rgba(167,139,250,0.04) 0%, transparent 50%),
      #090b10;
  }
`;

type Phase = "generating" | "speaking" | "listening" | "processing" | "done";
const TOTAL_QUESTIONS = 3;

export default function MockInterview() {
  const navigate = useNavigate();

  const [phase, setPhase] = React.useState<Phase>("generating");
  const [qIndex, setQIndex] = React.useState(0);
  const [history, setHistory] = React.useState<QAPair[]>([]);
  const [currentQ, setCurrentQ] = React.useState<{
    question: string;
    topic: string;
  } | null>(null);
  const [displayedQ, setDisplayedQ] = React.useState("");
  const [typingQ, setTypingQ] = React.useState(false);
  const [liveTranscript, setLive] = React.useState("");
  const [finalAnswer, setFinal] = React.useState("");
  const [, setError] = React.useState<string | null>(null);
  const [muted, setMuted] = React.useState(false);

  const sttRef = React.useRef<{ start: () => void; stop: () => void } | null>(
    null
  );
  const answerRef = React.useRef("");
  const questionsRef = React.useRef<QuestionItem[]>([]);

  React.useEffect(() => {
    if (!currentQ) return;
    setDisplayedQ("");
    setTypingQ(true);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayedQ(currentQ.question.slice(0, i));
      if (i >= currentQ.question.length) {
        clearInterval(iv);
        setTypingQ(false);
      }
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
      setTimeout(
        () => navigate("/mock-feedback", { state: { history: updated } }),
        800
      );
    } else {
      setQIndex(nextIdx);
      setTimeout(() => askQuestion(nextIdx, questionsRef.current), 600);
    }
  }

  function exitSession() {
    cancelSpeech();
    sttRef.current?.stop();
    navigate("/mock-feedback", { state: { history } });
  }

  const hasBooted = React.useRef(false);
  React.useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    setPhase("generating");
    generateAllQuestions(TOTAL_QUESTIONS)
      .then((qs) => {
        questionsRef.current = qs;
        askQuestion(0, qs);
      })
      .catch((e: any) => {
        setError(e?.message ?? "Failed to load questions");
        setPhase("processing");
      });

    return () => {
      cancelSpeech();
      sttRef.current?.stop();
    };
  }, []);

  // const questionNumber = qIndex + 1;
  // const progressPct = Math.round((qIndex / TOTAL_QUESTIONS) * 100);
  const aiSpeaking = phase === "speaking";
  const userSpeaking = phase === "listening";

  // const bannerMap: Record<
  //   Phase,
  //   { text: string; cls: string; spin?: boolean }
  // > = {
  //   generating: {
  //     text: "Loading questions…",
  //     cls: "border-[#202026] bg-[#090b10] text-neutral-400",
  //     spin: true,
  //   },
  //   speaking: {
  //     text: "AI is speaking…",
  //     cls: "border-[#7aecc4]/20 bg-[#7aecc4]/5 text-[#7aecc4]",
  //   },
  //   listening: {
  //     text: "Recording — click Done when finished",
  //     cls: "border-red-600/20 bg-red-600/5 text-red-400",
  //   },
  //   processing: {
  //     text: "Processing…",
  //     cls: "border-[#202026] bg-[#090b10] text-neutral-400",
  //     spin: true,
  //   },
  //   done: {
  //     text: "Interview complete! Generating feedback…",
  //     cls: "border-[#7aecc4]/20 bg-[#7aecc4]/5 text-[#7aecc4]",
  //   },
  // };
  // const banner = bannerMap[phase];

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-3">
          <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">
            MOCK INTERVIEW
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-white">
            Before we begin, verify your setup.
          </h1>
          {/* <header className="flex items-center justify-between gap-4 px-6 py-4 border-b-2 border-[#202026] bg-black">
          <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">
            MOCK INTERVIEW
          </p>
        </header> */}
        </div>

        <main className="flex-1 flex flex-col gap-5 px-6 py-6 max-w-5xl w-full mx-auto">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div
              className={`v-card relative rounded-2xl overflow-hidden border-2 border-[#202026] bg-[#090b10] aspect-[16/10] flex items-center justify-center transition-all duration-300 ${
                aiSpeaking ? "speaking glow-ai border-[#7aecc4]/30" : ""
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-[#0d1f1a] border-2 border-[#7aecc4]/20">
                  <div className="ring-pulse r1 absolute inset-[-6px] rounded-full border-[1.5px] opacity-0" />
                  <div className="ring-pulse r2 absolute inset-[-6px] rounded-full border-[1.5px] opacity-0" />
                  <Bot size={28} color="#7aecc4" />
                </div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  AI Interviewer
                </p>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#202026] bg-black/80 text-xs font-semibold text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7aecc4] flex-shrink-0" />
                Jasper.AI
              </div>
              <div
                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-300 ${
                  aiSpeaking
                    ? "border-[#7aecc4]/25 bg-[#7aecc4]/10 text-[#7aecc4]"
                    : "border-[#202026] bg-black/80 text-neutral-500"
                }`}
              >
                {aiSpeaking
                  ? "Speaking"
                  : phase === "generating"
                  ? "Thinking…"
                  : "Idle"}
              </div>
            </div>

            <div
              className={`v-card user-card user-card-bg relative rounded-2xl overflow-hidden border-2 border-[#202026] aspect-[16/10] flex items-center justify-center transition-all duration-300 ${
                userSpeaking ? "speaking glow-user border-red-600/30" : ""
              }`}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />

              <div className="relative z-[1] flex flex-col items-center gap-3">
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-[#1a0d1a] border-2 border-red-400/20">
                  <div className="ring-pulse r1 absolute inset-[-6px] rounded-full border-[1.5px] opacity-0" />
                  <div className="ring-pulse r2 absolute inset-[-6px] rounded-full border-[1.5px] opacity-0" />
                  <User size={28} color="#f87171" />
                </div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  You
                </p>
              </div>

              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#202026] bg-black/80 text-xs font-semibold text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                You
              </div>
              <div
                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-300 ${
                  userSpeaking
                    ? "border-red-600/25 bg-red-600/10 text-red-400"
                    : "border-[#202026] bg-black/80 text-neutral-500"
                }`}
              >
                {userSpeaking ? "● Recording" : "Waiting"}
              </div>
            </div>
          </div>

          {/* <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm font-semibold ${banner.cls}`}>
            {banner.spin
              ? <span className="animate-spin-slow inline-block">⟳</span>
              : <span>{phase === "speaking" ? "speaker" : phase === "listening" ? "mic" : "success"}</span>
            }
            <span>{error || banner.text}</span>
          </div> */}

          <div className="rounded-2xl border-2 border-[#202026] bg-[#090b10] px-5 py-4 min-h-[110px] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Live transcript
              </p>
              {currentQ && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    phase === "listening"
                      ? "bg-red-600/10 text-red-400"
                      : "bg-[#7aecc4]/10 text-[#7aecc4]"
                  }`}
                >
                  {phase === "listening" ? "You" : "Jasper.AI"}
                </span>
              )}
            </div>

            {(phase === "speaking" ||
              phase === "listening" ||
              phase === "processing" ||
              phase === "done") &&
            displayedQ ? (
              <p className="text-base font-semibold text-white leading-relaxed">
                {displayedQ}
                {typingQ && (
                  <span className="animate-blink inline-block w-[2px] h-[1em] bg-[#7aecc4] ml-1 align-middle rounded-sm" />
                )}
              </p>
            ) : phase === "generating" ? (
              <p className="text-sm text-neutral-600 italic">
                Loading your questions…
              </p>
            ) : (
              <p className="text-sm text-neutral-600 italic">Waiting…</p>
            )}

            {phase === "listening" && (finalAnswer || liveTranscript) && (
              <p className="text-sm text-neutral-400 italic">
                {finalAnswer && (
                  <span className="text-white not-italic font-medium">
                    {finalAnswer}{" "}
                  </span>
                )}
                {liveTranscript}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pb-2">
            <button
              onClick={() => setMuted((v) => !v)}
              title={muted ? "Unmute" : "Mute"}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                phase === "listening"
                  ? "animate-mic-pulse border-red-600/30 bg-red-600/10"
                  : "border-[#202026] bg-[#090b10] hover:border-[#2a2a32]"
              }`}
            >
              {muted ? (
                <MicOff size={20} color="#421717ff" />
              ) : (
                <Mic size={20} color="#7aecc4" />
              )}
            </button>

            <button
              disabled={phase !== "listening"}
              onClick={handleDoneAnswering}
              className="inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-6 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {qIndex + 1 >= TOTAL_QUESTIONS
                ? "Finish"
                : "Next Question"}
            </button>

            <button
              onClick={exitSession}
              title="End session"
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 border-red-600/20 bg-red-600/5 transition-all hover:bg-red-600/15 hover:border-red-600/40"
            >
              <PhoneOff size={20} color="#fc4339ff" />
            </button>
          </div>
        </main>
      </div>
    </>
  );
}