import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Bot, User } from "lucide-react";

import {
  generateAllQuestions,
  type QuestionItem,
  speakText,
  cancelSpeech,
  createSTT,
  type QAPair,
} from "../lib/interviewEngine";

const styles = `
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .animate-blink { animation: blink 1s step-end infinite; }

  @keyframes spin-slow { to { transform:rotate(360deg); } }
  .animate-spin-slow { animation: spin-slow 1s linear infinite; }

  /* Subtle "speaking" pulse ring */
  @keyframes ring {
    0%   { transform: scale(.95); opacity: .9; }
    70%  { transform: scale(1.25); opacity: 0; }
    100% { transform: scale(1.25); opacity: 0; }
  }
  .speaking-ring {
    animation: ring 1.4s ease-out infinite;
  }
`;

type Phase = "generating" | "speaking" | "listening" | "processing" | "done";
const TOTAL_QUESTIONS = 3;

const buttonPrimary =
  "inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-6 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed";

const buttonGhost =
  "inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-800 active:scale-[0.99]";

const buttonDanger =
  "inline-flex items-center justify-center rounded-xl border-2 border-red-600/25 bg-red-600/5 text-red-300 px-5 py-3 text-sm font-semibold transition hover:bg-red-600/15 hover:border-red-600/40 active:scale-[0.99]";

function AvatarCard({
  active,
  title,
  tone,
  icon,
}: {
  active: boolean;
  title: string;
  tone: "ai" | "you";
  icon: React.ReactNode;
}) {
  const activeBorder =
    tone === "ai" ? "border-[#7aecc4]/35" : "border-red-600/30";
  const idleBorder = "border-[#202026] hover:border-[#2a2a32]";
  const ringColor = tone === "ai" ? "border-[#7aecc4]/30" : "border-red-600/25";
  const badgeColor = tone === "ai" ? "#7aecc4" : "#f87171";

  return (
    <div
      className={[
        "relative rounded-2xl border-2 bg-[#090b10] p-5 transition-all",
        "aspect-square flex items-center justify-center overflow-hidden",
        active ? activeBorder : idleBorder,
      ].join(" ")}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-[1] flex flex-col items-center justify-center">
        <div className="relative">
          {active && (
            <>
              <div
                className={[
                  "absolute inset-[-12px] rounded-full border-2",
                  "speaking-ring",
                  ringColor,
                ].join(" ")}
              />
              <div
                className={[
                  "absolute inset-[-18px] rounded-full border-2",
                  "speaking-ring",
                  ringColor,
                ].join(" ")}
                style={{ animationDelay: "0.45s" }}
              />
            </>
          )}

          <div
            className={[
              "w-16 h-16 rounded-full flex items-center justify-center",
              "border-2 bg-black/40",
              tone === "ai" ? "border-[#7aecc4]/25" : "border-red-600/20",
            ].join(" ")}
          >
            {icon}
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold text-white uppercase tracking-wide">
          {title}
        </p>

        {active && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: badgeColor }}
            />
            <span className="text-xs font-semibold text-neutral-400">
              Speaking
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [muted, setMuted] = React.useState(false);

  const sttRef = React.useRef<{ start: () => void; stop: () => void } | null>(
    null
  );
  const answerRef = React.useRef("");
  const questionsRef = React.useRef<QuestionItem[]>([]);

  const hasBooted = React.useRef(false);

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
    answerRef.current = "";

    try {
      setPhase("speaking");
      if (!muted) await speakText(q.question);

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

  function backSession() {
    cancelSpeech();
    sttRef.current?.stop();
    navigate("/mock-interview");
  }

  function exitSession() {
    cancelSpeech();
    sttRef.current?.stop();
    navigate("/mock-feedback");
  }

  React.useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;

    setPhase("generating");
    generateAllQuestions(TOTAL_QUESTIONS).then((qs) => {
      questionsRef.current = qs;
      askQuestion(0, qs);
    });

    return () => {
      cancelSpeech();
      sttRef.current?.stop();
    };
  }, []);

  const aiSpeaking = phase === "speaking";
  const userSpeaking = phase === "listening";

  const speakerLabel =
    phase === "listening" ? "You" : phase === "speaking" ? "Interviewer" : null;

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">
            MOCK INTERVIEW
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-white">
            Live session
          </h1>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <AvatarCard
              active={aiSpeaking}
              title="Interviewer"
              tone="ai"
              icon={<Bot size={28} color="#7aecc4" />}
            />
            <AvatarCard
              active={userSpeaking}
              title="You"
              tone="you"
              icon={<User size={28} color="#f87171" />}
            />
          </div>

          <div className="mt-5 rounded-2xl border-2 border-[#202026] bg-[#090b10] px-5 py-4 min-h-[120px] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Live transcript
              </p>
              {speakerLabel && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    phase === "listening"
                      ? "bg-red-600/10 text-red-400"
                      : "bg-[#7aecc4]/10 text-[#7aecc4]"
                  }`}
                >
                  {speakerLabel}
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

          <div className="mt-6 flex items-center justify-between">
            <button className={buttonGhost} onClick={backSession}>
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMuted((v) => !v)}
                className={buttonGhost}
              >
                {muted ? "Unmute" : "Mute"}
              </button>

              <button
                disabled={phase !== "listening"}
                onClick={handleDoneAnswering}
                className={buttonPrimary}
              >
                {qIndex + 1 >= TOTAL_QUESTIONS ? "Done" : "Done"}
              </button>

              <button onClick={exitSession} className={buttonDanger}>
                End
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
