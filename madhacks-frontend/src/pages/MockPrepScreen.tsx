import * as React from "react";
import { useNavigate } from "react-router-dom";

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .prep-root {
    min-height: 100vh;
    background: #07070d;
    font-family: 'Sora', sans-serif;
    color: #e2e2ee;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 24px;
  }

  /* radial glow backdrops */
  .prep-root::before {
    content: '';
    position: fixed;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124,240,200,0.055) 0%, transparent 70%);
    top: -160px; left: -160px;
    pointer-events: none;
  }
  .prep-root::after {
    content: '';
    position: fixed;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124,140,240,0.06) 0%, transparent 70%);
    bottom: -100px; right: -100px;
    pointer-events: none;
  }

  /* subtle dot grid */
  .dot-grid {
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 36px 36px;
    pointer-events: none;
    z-index: 0;
  }

  .prep-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 860px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 28px;
    backdrop-filter: blur(20px);
    overflow: hidden;
    animation: card-in 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* top accent bar */
  .prep-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #7cf0c8 0%, #7c8cf0 50%, transparent 100%);
  }

  /* ── Header ── */
  .prep-header {
    padding: 32px 36px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  .prep-title-group {}

  .prep-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #7cf0c8;
    margin-bottom: 6px;
  }

  .prep-title {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: #fff;
  }

  .prep-title span {
    color: rgba(255,255,255,0.3);
    font-weight: 300;
  }

  .step-pills {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .step-pill {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.03);
    transition: all 0.25s;
  }

  .step-pill.active {
    border-color: rgba(124,240,200,0.4);
    color: #7cf0c8;
    background: rgba(124,240,200,0.07);
  }

  .step-pill.done {
    border-color: rgba(124,240,200,0.2);
    color: rgba(124,240,200,0.5);
    background: rgba(124,240,200,0.04);
  }

  /* ── Body ── */
  .prep-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  @media (max-width: 680px) {
    .prep-body { grid-template-columns: 1fr; }
    .prep-divider { display: none; }
  }

  .prep-section {
    padding: 28px 36px;
    animation: fade-up 0.4s ease both;
  }

  .prep-section:first-child { animation-delay: 0.05s; }
  .prep-section:last-child  {
    animation-delay: 0.1s;
    border-left: 1px solid rgba(255,255,255,0.06);
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 18px;
  }

  /* ── Camera Preview ── */
  .camera-preview {
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: 16px;
    background: #0e0e18;
    border: 1px solid rgba(255,255,255,0.07);
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
  }

  .camera-preview video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 16px;
  }

  .camera-off-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: none;
  }

  .camera-icon {
    font-size: 36px;
  }

  .camera-off-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.08em;
  }

  .camera-corner-tag {
    position: absolute;
    bottom: 10px;
    left: 10px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.06em;
  }

  /* camera enable button overlay */
  .enable-cam-btn {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 16px;
    transition: background 0.2s;
  }

  .enable-cam-btn:hover { background: rgba(124,240,200,0.04); }

  /* ── Check rows ── */
  .check-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 16px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.02);
    transition: border-color 0.3s, background 0.3s;
    cursor: pointer;
    user-select: none;
  }

  .check-row:hover {
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
  }

  .check-row.ok {
    border-color: rgba(124,240,200,0.2);
    background: rgba(124,240,200,0.04);
  }

  .check-row.warn {
    border-color: rgba(251,191,36,0.2);
    background: rgba(251,191,36,0.04);
  }

  .check-row.err {
    border-color: rgba(248,113,113,0.2);
    background: rgba(248,113,113,0.04);
  }

  .check-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 17px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .check-row.ok  .check-icon-wrap { background: rgba(124,240,200,0.08); border-color: rgba(124,240,200,0.15); }
  .check-row.warn .check-icon-wrap { background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.15); }
  .check-row.err  .check-icon-wrap { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.15); }

  .check-text { flex: 1; min-width: 0; }

  .check-name {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.85);
  }

  .check-sub {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.3);
    margin-top: 2px;
    letter-spacing: 0.04em;
  }

  .check-badge {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.06em;
    padding: 3px 9px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  .badge-ok   { color: #7cf0c8; background: rgba(124,240,200,0.1); border: 1px solid rgba(124,240,200,0.2); }
  .badge-warn { color: #fbbf24; background: rgba(251,191,36,0.1);  border: 1px solid rgba(251,191,36,0.2); }
  .badge-err  { color: #f87171; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2); }
  .badge-idle { color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }

  /* ── Mic visualiser ── */
  .mic-visual {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    height: 28px;
    margin-top: 8px;
  }

  .mic-bar {
    width: 4px;
    border-radius: 3px;
    background: #7cf0c8;
    transition: height 0.1s ease;
    min-height: 4px;
  }

  /* device selects */
  .device-select-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }

  .device-row {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .device-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
  }

  .device-select {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 9px 14px;
    color: rgba(255,255,255,0.75);
    font-family: 'Sora', sans-serif;
    font-size: 12px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 34px;
  }

  .device-select:hover, .device-select:focus {
    border-color: rgba(124,240,200,0.3);
    background-color: rgba(124,240,200,0.04);
  }

  .device-select option {
    background: #111118;
    color: #e2e2ee;
  }

  /* ── Interview info ── */
  .info-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }

  .info-chip {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 13px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    font-size: 12px;
    color: rgba(255,255,255,0.6);
  }

  .info-chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #7cf0c8;
    flex-shrink: 0;
  }

  /* ── Footer ── */
  .prep-footer {
    padding: 24px 36px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  .footer-hint {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.06em;
  }

  .footer-hint span {
    color: rgba(124,240,200,0.5);
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-ghost {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-ghost:hover {
    border-color: rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.04);
  }

  .btn-proceed {
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 600;
    padding: 12px 28px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #7cf0c8, #5ad4a8);
    color: #07140f;
    cursor: pointer;
    transition: all 0.25s;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 0 0 0 rgba(124,240,200,0.3);
  }

  .btn-proceed:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(124,240,200,0.2), 0 0 0 1px rgba(124,240,200,0.4);
  }

  .btn-proceed:active { transform: translateY(0); }

  .btn-proceed:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-arrow {
    font-size: 16px;
    transition: transform 0.2s;
  }

  .btn-proceed:hover .btn-arrow { transform: translateX(3px); }

  /* ── Readiness banner ── */
  .readiness-bar {
    margin: 0 36px 20px;
    padding: 12px 18px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    animation: fade-up 0.3s ease both;
    animation-delay: 0.15s;
  }

  .readiness-bar.ready {
    background: rgba(124,240,200,0.07);
    border: 1px solid rgba(124,240,200,0.2);
    color: rgba(124,240,200,0.85);
  }

  .readiness-bar.not-ready {
    background: rgba(251,191,36,0.06);
    border: 1px solid rgba(251,191,36,0.18);
    color: rgba(251,191,36,0.8);
  }

  .readiness-icon { font-size: 16px; }

  /* mic volume bars animation when active */
  @keyframes bar-dance {
    0%,100% { height: 4px; }
    50%      { height: var(--h); }
  }

  .bar-active {
    animation: bar-dance 0.4s ease-in-out infinite;
    animation-delay: var(--delay);
  }
`;

// ─── Types ─────────────────────────────────────────────────────────────────

type CheckStatus = "idle" | "ok" | "warn" | "err";

interface Check {
  id: string;
  icon: string;
  name: string;
  sub: string;
  status: CheckStatus;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function MockPrepScreen() {
  const navigate = useNavigate();

  // camera / mic state
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number>(0);

  const [camEnabled, setCamEnabled] = React.useState(false);
  const [micEnabled, setMicEnabled] = React.useState(false);
  const [micVolume, setMicVolume] = React.useState<number[]>(Array(12).fill(4));

  const [micDevices, setMicDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [camDevices, setCamDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = React.useState("");
  const [selectedCam, setSelectedCam] = React.useState("");

  const [checks, setChecks] = React.useState<Check[]>([
    { id: "mic",       icon: "🎙️", name: "Microphone",    sub: "Click to test",          status: "idle" },
    { id: "cam",       icon: "📷", name: "Camera",         sub: "Click to preview",       status: "idle" },
    { id: "browser",   icon: "🌐", name: "Browser compat", sub: "Checking…",              status: "idle" },
    { id: "network",   icon: "📶", name: "Network",        sub: "Checking connectivity…", status: "idle" },
  ]);

  // ── On mount: browser + network checks ──────────────────────────────────
  React.useEffect(() => {
    // browser check
    const supported = !!navigator.mediaDevices?.getUserMedia;
    updateCheck("browser", supported ? "ok" : "err",
      supported ? "WebRTC supported" : "Not supported");

    // network ping (just check online)
    const online = navigator.onLine;
    updateCheck("network", online ? "ok" : "err",
      online ? "Connected" : "No connection");

    // enumerate devices
    navigator.mediaDevices?.enumerateDevices().then((devs) => {
      setMicDevices(devs.filter((d) => d.kind === "audioinput"));
      setCamDevices(devs.filter((d) => d.kind === "videoinput"));
    });

    return () => {
      stopStream();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  function updateCheck(id: string, status: CheckStatus, sub?: string) {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, sub: sub ?? c.sub } : c))
    );
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // ── Toggle mic ───────────────────────────────────────────────────────────
  async function toggleMic() {
    if (micEnabled) {
      stopStream();
      setMicEnabled(false);
      cancelAnimationFrame(animFrameRef.current);
      setMicVolume(Array(12).fill(4));
      updateCheck("mic", "idle", "Click to test");
      return;
    }
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
        video: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setMicEnabled(true);
      updateCheck("mic", "ok", "Microphone active");

      // Enumerate after permission
      const devs = await navigator.mediaDevices.enumerateDevices();
      setMicDevices(devs.filter((d) => d.kind === "audioinput"));
      setCamDevices(devs.filter((d) => d.kind === "videoinput"));

      // Visualiser
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;

      const buf = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(buf);
        const bars = Array.from({ length: 12 }, (_, i) => {
          const v = buf[Math.floor((i / 12) * buf.length)] / 255;
          return Math.max(4, Math.round(v * 28));
        });
        setMicVolume(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      updateCheck("mic", "err", "Permission denied");
    }
  }

  // ── Toggle camera ────────────────────────────────────────────────────────
  async function toggleCamera() {
    if (camEnabled) {
      streamRef.current?.getVideoTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamEnabled(false);
      updateCheck("cam", "idle", "Click to preview");
      return;
    }
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCamEnabled(true);
      updateCheck("cam", "ok", "Camera active");

      const devs = await navigator.mediaDevices.enumerateDevices();
      setCamDevices(devs.filter((d) => d.kind === "videoinput"));
      setMicDevices(devs.filter((d) => d.kind === "audioinput"));
    } catch {
      updateCheck("cam", "err", "Permission denied");
    }
  }

  function handleCheckClick(id: string) {
    if (id === "mic") toggleMic();
    if (id === "cam") toggleCamera();
  }

  const isReady = checks.every((c) => c.status === "ok" || c.status === "warn");
  const micCheck = checks.find((c) => c.id === "mic")!;
  const camCheck = checks.find((c) => c.id === "cam")!;

  function badgeLabel(s: CheckStatus) {
    if (s === "ok")   return "OK";
    if (s === "warn") return "WARN";
    if (s === "err")  return "FAIL";
    return "IDLE";
  }

  function badgeCls(s: CheckStatus) {
    if (s === "ok")   return "check-badge badge-ok";
    if (s === "warn") return "check-badge badge-warn";
    if (s === "err")  return "check-badge badge-err";
    return "check-badge badge-idle";
  }

  return (
    <>
      <style>{styles}</style>
      <div className="prep-root">
        <div className="dot-grid" />

        <div className="prep-card">
          {/* Header */}
          <div className="prep-header">
            <div className="prep-title-group">
              <div className="prep-eyebrow">Mock Interview · Setup</div>
              <div className="prep-title">Before we begin <span>— check your setup</span></div>
            </div>
            <div className="step-pills">
              <div className="step-pill active">01 · Prep</div>
              <div className="step-pill">02 · Interview</div>
              <div className="step-pill">03 · Feedback</div>
            </div>
          </div>

          {/* Body grid */}
          <div className="prep-body">

            {/* LEFT — Camera preview */}
            <div className="prep-section">
              <div className="section-label">Camera preview</div>

              <div className="camera-preview">
                {!camEnabled && (
                  <div className="camera-off-state">
                    <div className="camera-icon">📷</div>
                    <div className="camera-off-label">Camera off</div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  style={{ display: camEnabled ? "block" : "none" }}
                />
                <button className="enable-cam-btn" onClick={toggleCamera} title={camEnabled ? "Disable camera" : "Enable camera"} />
                <div className="camera-corner-tag">
                  {camEnabled ? "● Live" : "Paused"}
                </div>
              </div>

              {/* Mic visualiser */}
              {micEnabled && (
                <div className="mic-visual" style={{ marginTop: 16 }}>
                  {micVolume.map((h, i) => (
                    <div
                      key={i}
                      className="mic-bar"
                      style={{ height: h, opacity: 0.6 + (h / 28) * 0.4 }}
                    />
                  ))}
                </div>
              )}

              {!micEnabled && (
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: "0.08em"
                  }}>
                    Enable mic to see audio levels
                  </span>
                </div>
              )}

              {/* Device selectors */}
              <div className="device-select-group" style={{ marginTop: 18 }}>
                <div className="device-row">
                  <div className="device-label">Microphone</div>
                  <select
                    className="device-select"
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                  >
                    <option value="">Default microphone</option>
                    {micDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="device-row">
                  <div className="device-label">Camera</div>
                  <select
                    className="device-select"
                    value={selectedCam}
                    onChange={(e) => setSelectedCam(e.target.value)}
                  >
                    <option value="">Default camera</option>
                    {camDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT — Checks + interview info */}
            <div className="prep-section">
              <div className="section-label">System checks</div>

              <div className="check-list">
                {checks.map((c) => (
                  <div
                    key={c.id}
                    className={`check-row ${c.status}`}
                    onClick={() => handleCheckClick(c.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckClick(c.id)}
                  >
                    <div className="check-icon-wrap">{c.icon}</div>
                    <div className="check-text">
                      <div className="check-name">{c.name}</div>
                      <div className="check-sub">{c.sub}</div>
                    </div>
                    <div className={badgeCls(c.status)}>{badgeLabel(c.status)}</div>
                  </div>
                ))}
              </div>

              <div className="section-label" style={{ marginTop: 20 }}>Interview details</div>
              <div className="info-chips">
                <div className="info-chip">
                  <span className="info-chip-dot" />
                  ~30 min
                </div>
                <div className="info-chip">
                  <span className="info-chip-dot" style={{ background: "#7c8cf0" }} />
                  Technical · DSA
                </div>
                <div className="info-chip">
                  <span className="info-chip-dot" style={{ background: "#f0c87c" }} />
                  2–3 questions
                </div>
                <div className="info-chip">
                  <span className="info-chip-dot" style={{ background: "#f07ca0" }} />
                  AI interviewer
                </div>
              </div>

              <div style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: 8,
                }}>Tips</div>
                {[
                  "Speak clearly — the AI will transcribe you in real-time",
                  "Think aloud; reasoning matters as much as the answer",
                  "Ask clarifying questions before jumping to code",
                ].map((tip, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: i < 2 ? 8 : 0,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.5,
                  }}>
                    <span style={{ color: "#7cf0c8", fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Readiness banner */}
          <div className={`readiness-bar ${isReady ? "ready" : "not-ready"}`}>
            <span className="readiness-icon">{isReady ? "✅" : "⚠️"}</span>
            <span>
              {isReady
                ? "All checks passed — you're good to go!"
                : "Enable your mic and camera, then verify all checks are green before proceeding."}
            </span>
          </div>

          {/* Footer */}
          <div className="prep-footer">
            <div className="footer-hint">
              Checks: <span>{checks.filter((c) => c.status === "ok").length}</span>/{checks.length} passed
            </div>
            <div className="footer-actions">
              <button className="btn-ghost" onClick={() => navigate("/dashboard")}>
                Cancel
              </button>
              <button
                className="btn-proceed"
                disabled={!isReady}
                onClick={() => navigate("/mock-interview/session")}
              >
                Proceed to interview
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}