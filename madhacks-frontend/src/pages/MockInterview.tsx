import * as React from "react";
import { useNavigate } from "react-router-dom";

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');

  .mock-root {
    min-height: 100vh;
    background: #0a0a0f;
    color: #e8e8f0;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* subtle grid overlay */
  .mock-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }

  .mock-header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 32px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(10,10,15,0.85);
    backdrop-filter: blur(12px);
  }

  .mock-logo {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
  }

  .mock-logo span {
    color: #7cf0c8;
  }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f87171;
    animation: pulse-dot 1.8s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  .btn-back {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 7px 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-back:hover {
    color: rgba(255,255,255,0.7);
    border-color: rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.04);
  }

  /* ── Main content ── */
  .mock-body {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 32px;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  /* ── Video grid ── */
  .video-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 700px) {
    .video-grid { grid-template-columns: 1fr; }
    .mock-body { padding: 16px; }
  }

  .video-card {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    aspect-ratio: 16 / 10;
    background: #111118;
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 0 0 0 rgba(124,240,200,0);
    transition: box-shadow 0.4s;
  }

  .video-card.speaking {
    box-shadow: 0 0 0 2px #7cf0c8, 0 0 32px 0 rgba(124,240,200,0.15);
  }

  /* avatar area */
  .video-inner {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }

  .avatar-ring {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .avatar-ring.ai {
    background: linear-gradient(135deg, #1a2a3a, #0d1f2d);
    border: 2px solid rgba(124,240,200,0.3);
  }

  .avatar-ring.user {
    background: linear-gradient(135deg, #1e1a2e, #120f20);
    border: 2px solid rgba(167,139,250,0.3);
  }

  .avatar-icon {
    font-size: 32px;
    line-height: 1;
    user-select: none;
  }

  /* speaking wave rings */
  .ring-pulse {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1.5px solid;
    opacity: 0;
    transform: scale(0.9);
  }

  .speaking .ring-pulse.r1 {
    border-color: rgba(124,240,200,0.5);
    animation: ring-expand 1.8s ease-out infinite;
  }
  .speaking .ring-pulse.r2 {
    border-color: rgba(124,240,200,0.3);
    animation: ring-expand 1.8s ease-out 0.5s infinite;
  }
  .user-card.speaking .ring-pulse.r1 {
    border-color: rgba(167,139,250,0.5);
    animation: ring-expand 1.8s ease-out infinite;
  }
  .user-card.speaking .ring-pulse.r2 {
    border-color: rgba(167,139,250,0.3);
    animation: ring-expand 1.8s ease-out 0.5s infinite;
  }

  @keyframes ring-expand {
    0%   { opacity: 0.9; transform: scale(0.95); }
    100% { opacity: 0;   transform: scale(1.6); }
  }

  .card-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
  }

  /* corner name tag */
  .name-tag {
    position: absolute;
    bottom: 14px;
    left: 14px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    padding: 5px 12px;
    border-radius: 8px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.65);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .name-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* corner mic indicator */
  .mic-tag {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  /* ── Subtitle bar ── */
  .subtitle-wrap {
    position: relative;
    border-radius: 16px;
    background: #111118;
    border: 1px solid rgba(255,255,255,0.07);
    padding: 24px 28px;
    min-height: 110px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: hidden;
  }

  .subtitle-wrap::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #7cf0c8, #7c9df0, #c07cf0);
    border-radius: 16px 16px 0 0;
  }

  .subtitle-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .subtitle-title {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }

  .subtitle-speaker {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 20px;
  }

  .subtitle-speaker.ai {
    color: #7cf0c8;
    background: rgba(124,240,200,0.08);
    border: 1px solid rgba(124,240,200,0.2);
  }

  .subtitle-speaker.user {
    color: #a78bfa;
    background: rgba(167,139,250,0.08);
    border: 1px solid rgba(167,139,250,0.2);
  }

  .subtitle-text {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255,255,255,0.85);
    min-height: 52px;
    display: flex;
    align-items: center;
  }

  .subtitle-text.idle {
    color: rgba(255,255,255,0.2);
    font-style: italic;
    font-size: 14px;
  }

  /* typing cursor blink */
  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: #7cf0c8;
    margin-left: 3px;
    vertical-align: middle;
    border-radius: 1px;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  /* ── Controls bar ── */
  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding-bottom: 8px;
  }

  .ctrl-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    transition: all 0.2s;
  }

  .ctrl-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.2);
    transform: scale(1.07);
  }

  .ctrl-btn.end {
    width: 56px;
    height: 56px;
    font-size: 20px;
    background: rgba(248,113,113,0.15);
    border-color: rgba(248,113,113,0.35);
  }

  .ctrl-btn.end:hover {
    background: rgba(248,113,113,0.28);
    border-color: rgba(248,113,113,0.6);
  }

  .ctrl-btn.muted {
    background: rgba(248,113,113,0.1);
    border-color: rgba(248,113,113,0.3);
  }
`;

// ─── Demo subtitle lines ────────────────────────────────────────────────────

const DEMO_LINES = [
  { speaker: "ai" as const,   text: "Let's start with something foundational — can you walk me through how you'd find the two numbers in an array that sum to a target?" },
  { speaker: "user" as const, text: "Sure! I'd use a hashmap. For each number I check if the complement exists in the map, otherwise I store it." },
  { speaker: "ai" as const,   text: "Nice. What's the time and space complexity of that approach?" },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function MockInterview() {
  const navigate = useNavigate();

  const [lineIdx, setLineIdx]       = React.useState(0);
  const [displayed, setDisplayed]   = React.useState("");
  const [typing, setTyping]         = React.useState(false);
  const [muted, setMuted]           = React.useState(false);
  const [videoOff, setVideoOff]     = React.useState(false);

  const current = DEMO_LINES[lineIdx] ?? null;
  const aiSpeaking   = typing && current?.speaker === "ai";
  const userSpeaking = typing && current?.speaker === "user";

  // typewriter effect cycling through demo lines
  React.useEffect(() => {
    const line = DEMO_LINES[lineIdx];
    if (!line) return;

    setDisplayed("");
    setTyping(true);

    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(line.text.slice(0, i));
      if (i >= line.text.length) {
        clearInterval(iv);
        setTyping(false);
        // pause then move to next
        const t = setTimeout(() => {
          setLineIdx((p) => (p + 1) % DEMO_LINES.length);
        }, 2800);
        return () => clearTimeout(t);
      }
    }, 28);

    return () => clearInterval(iv);
  }, [lineIdx]);

  return (
    <>
      <style>{styles}</style>
      <div className="mock-root">
        {/* Header */}
        <header className="mock-header">
          <div className="mock-logo">prep<span>AI</span> · mock session</div>
          <div className="live-badge">
            <span className="live-dot" />
            Live
          </div>
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            ← Exit
          </button>
        </header>

        {/* Body */}
        <main className="mock-body">

          {/* Video boxes */}
          <div className="video-grid">

            {/* AI card */}
            <div className={`video-card ${aiSpeaking ? "speaking" : ""}`}>
              <div className="video-inner">
                <div className={`avatar-ring ai ${aiSpeaking ? "speaking" : ""}`}>
                  <div className="ring-pulse r1" />
                  <div className="ring-pulse r2" />
                  <span className="avatar-icon">🤖</span>
                </div>
                <span className="card-label">AI Interviewer</span>
              </div>
              <div className="name-tag">
                <span className="name-dot" style={{ background: "#7cf0c8" }} />
                Aria · AI
              </div>
              <div className="mic-tag">🎙️</div>
            </div>

            {/* User card */}
            <div className={`video-card user-card ${userSpeaking ? "speaking" : ""}`}>
              <div className="video-inner">
                {videoOff ? (
                  <>
                    <div className={`avatar-ring user ${userSpeaking ? "speaking" : ""}`}>
                      <div className="ring-pulse r1" />
                      <div className="ring-pulse r2" />
                      <span className="avatar-icon">🧑‍💻</span>
                    </div>
                    <span className="card-label">Camera off</span>
                  </>
                ) : (
                  <>
                    <div className={`avatar-ring user ${userSpeaking ? "speaking" : ""}`}>
                      <div className="ring-pulse r1" />
                      <div className="ring-pulse r2" />
                      <span className="avatar-icon">🧑‍💻</span>
                    </div>
                    <span className="card-label">You</span>
                  </>
                )}
              </div>
              <div className="name-tag">
                <span className="name-dot" style={{ background: "#a78bfa" }} />
                You
              </div>
              <div className="mic-tag">{muted ? "🔇" : "🎤"}</div>
            </div>
          </div>

          {/* Subtitle bar */}
          <div className="subtitle-wrap">
            <div className="subtitle-header">
              <span className="subtitle-title">Live transcript</span>
              {current && (
                <span className={`subtitle-speaker ${current.speaker}`}>
                  {current.speaker === "ai" ? "Aria · AI" : "You"}
                </span>
              )}
            </div>
            <div className={`subtitle-text ${!displayed ? "idle" : ""}`}>
              {displayed
                ? <>{displayed}{typing && <span className="cursor" />}</>
                : "Waiting for speech…"}
            </div>
          </div>

          {/* Controls */}
          <div className="controls">
            <button
              className={`ctrl-btn ${muted ? "muted" : ""}`}
              title={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted((v) => !v)}
            >
              {muted ? "🔇" : "🎤"}
            </button>
            <button
              className="ctrl-btn"
              title={videoOff ? "Turn camera on" : "Turn camera off"}
              onClick={() => setVideoOff((v) => !v)}
            >
              {videoOff ? "📷" : "🎥"}
            </button>
            <button
              className="ctrl-btn end"
              title="End session"
              onClick={() => navigate("/dashboard")}
            >
              📵
            </button>
            <button className="ctrl-btn" title="Settings">⚙️</button>
          </div>

        </main>
      </div>
    </>
  );
}