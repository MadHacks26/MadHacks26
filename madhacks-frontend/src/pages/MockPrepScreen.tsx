import * as React from "react";
import { useNavigate } from "react-router-dom";

type CheckStatus = "idle" | "ok" | "warn" | "err";

interface Check {
  id: string;
  icon: string;
  name: string;
  sub: string;
  status: CheckStatus;
}

function statusRowCls(s: CheckStatus) {
  if (s === "ok")   return "flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 cursor-pointer select-none transition-all";
  if (s === "warn") return "flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 cursor-pointer select-none transition-all";
  if (s === "err")  return "flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-400/20 bg-red-400/5 cursor-pointer select-none transition-all";
  return "flex items-center gap-3 px-4 py-3 rounded-2xl border border-neutral-800 bg-neutral-800/30 cursor-pointer select-none transition-all hover:border-neutral-700/60 hover:bg-neutral-800/50";
}

function statusIconWrapCls(s: CheckStatus) {
  if (s === "ok")   return "w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0";
  if (s === "warn") return "w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-amber-400/10 border border-amber-400/20 flex-shrink-0";
  if (s === "err")  return "w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-red-400/10 border border-red-400/20 flex-shrink-0";
  return "w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-neutral-800/50 border border-neutral-800 flex-shrink-0";
}

function statusBadgeCls(s: CheckStatus) {
  if (s === "ok")   return "font-mono text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400";
  if (s === "warn") return "font-mono text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-300";
  if (s === "err")  return "font-mono text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border border-red-400/25 bg-red-400/10 text-red-400";
  return "font-mono text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border border-neutral-700/50 bg-neutral-800/50 text-white/30";
}

function badgeLabel(s: CheckStatus) {
  if (s === "ok")   return "OK";
  if (s === "warn") return "WARN";
  if (s === "err")  return "FAIL";
  return "IDLE";
}

export default function MockPrepScreen() {
  const navigate = useNavigate();

  const videoRef     = React.useRef<HTMLVideoElement>(null);
  const streamRef    = React.useRef<MediaStream | null>(null);
  const analyserRef  = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number>(0);

  const [camEnabled, setCamEnabled] = React.useState(false);
  const [micEnabled, setMicEnabled] = React.useState(false);
  const [micVolume,  setMicVolume]  = React.useState<number[]>(Array(12).fill(4));
  const [micDevices, setMicDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [camDevices, setCamDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = React.useState("");
  const [selectedCam, setSelectedCam] = React.useState("");

  const [checks, setChecks] = React.useState<Check[]>([
    { id: "mic",     icon: "🎙️", name: "Microphone",    sub: "Click to test",          status: "idle" },
    { id: "cam",     icon: "📷", name: "Camera",         sub: "Click to preview",       status: "idle" },
    { id: "browser", icon: "🌐", name: "Browser compat", sub: "Checking…",              status: "idle" },
    { id: "network", icon: "📶", name: "Network",        sub: "Checking connectivity…", status: "idle" },
  ]);

  React.useEffect(() => {
    const supported = !!navigator.mediaDevices?.getUserMedia;
    updateCheck("browser", supported ? "ok" : "err", supported ? "WebRTC supported" : "Not supported");
    updateCheck("network", navigator.onLine ? "ok" : "err", navigator.onLine ? "Connected" : "No connection");
    navigator.mediaDevices?.enumerateDevices().then((devs) => {
      setMicDevices(devs.filter((d) => d.kind === "audioinput"));
      setCamDevices(devs.filter((d) => d.kind === "videoinput"));
    });
    return () => { stopStream(); cancelAnimationFrame(animFrameRef.current); };
  }, []);

  function updateCheck(id: string, status: CheckStatus, sub?: string) {
    setChecks((prev) => prev.map((c) => c.id === id ? { ...c, status, sub: sub ?? c.sub } : c));
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
        video: false,
      });
      streamRef.current = stream;
      setMicEnabled(true);
      updateCheck("mic", "ok", "Microphone active");

      const devs = await navigator.mediaDevices.enumerateDevices();
      setMicDevices(devs.filter((d) => d.kind === "audioinput"));
      setCamDevices(devs.filter((d) => d.kind === "videoinput"));

      const ctx      = new AudioContext();
      const src      = ctx.createMediaStreamSource(stream);
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

  async function toggleCamera() {
    if (camEnabled) {
      streamRef.current?.getVideoTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamEnabled(false);
      updateCheck("cam", "idle", "Click to preview");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
        audio: false,
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
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

  const isReady   = checks.every((c) => c.status === "ok" || c.status === "warn");
  const passCount = checks.filter((c) => c.status === "ok").length;

  const tips = [
    "Speak clearly — the AI will transcribe you in real-time",
    "Think aloud; reasoning matters as much as the answer",
    "Ask clarifying questions before jumping to code",
  ];

  return (
    <div className="min-h-screen bg-[#07070d] text-[#e2e2ee] font-sans flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background glows */}
      <div className="fixed w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(124,240,200,0.055)_0%,transparent_70%)] -top-40 -left-40 pointer-events-none" />
      <div className="fixed w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(124,140,240,0.06)_0%,transparent_70%)] -bottom-24 -right-24 pointer-events-none" />

      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "36px 36px" }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[860px] bg-neutral-900/60 border border-neutral-700/50 rounded-[28px] backdrop-blur-xl overflow-hidden animate-[card-in_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
        style={{ animation: "card-in 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>

        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7cf0c8] via-[#7c8cf0] to-transparent" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4 px-9 pt-8 pb-6 border-b border-neutral-800">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#7cf0c8] mb-1.5">
              Mock Interview · Setup
            </div>
            <div className="text-[22px] font-semibold tracking-tight text-white">
              Before we begin <span className="text-white/30 font-light">— check your setup</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { label: "01 · Prep",      active: true,  done: false },
              { label: "02 · Interview", active: false, done: false },
              { label: "03 · Feedback",  active: false, done: false },
            ].map((pill) => (
              <span key={pill.label} className={[
                "font-mono text-[10px] tracking-[0.08em] px-3 py-1 rounded-full border transition-all",
                pill.active
                  ? "border-[#7cf0c8]/40 text-[#7cf0c8] bg-[#7cf0c8]/7"
                  : "border-neutral-700/50 text-white/30 bg-neutral-800/40",
              ].join(" ")}>
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Body grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* LEFT — Camera + mic */}
          <div className="p-7 md:p-9">
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/30 mb-4">
              Camera preview
            </div>

            {/* Camera box */}
            <div className="relative w-full aspect-[16/10] rounded-2xl bg-[#0e0e18] border border-neutral-700/35 overflow-hidden flex items-center justify-center flex-col gap-2.5">
              {!camEnabled && (
                <div className="flex flex-col items-center gap-2.5 pointer-events-none">
                  <span className="text-4xl">📷</span>
                  <span className="font-mono text-[11px] text-white/25 tracking-[0.08em]">Camera off</span>
                </div>
              )}
              <video
                ref={videoRef}
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover rounded-2xl ${camEnabled ? "block" : "hidden"}`}
              />
              <button
                onClick={toggleCamera}
                title={camEnabled ? "Disable camera" : "Enable camera"}
                className="absolute inset-0 bg-transparent border-none rounded-2xl hover:bg-[#7cf0c8]/4 transition-colors cursor-pointer"
              />
              <div className="absolute bottom-2.5 left-2.5 font-mono text-[10px] px-2.5 py-1 rounded-lg bg-black/60 border border-neutral-700/35 text-white/50 tracking-[0.06em]">
                {camEnabled ? "● Live" : "Paused"}
              </div>
            </div>

            {/* Mic visualiser */}
            <div className="mt-4 h-8 flex items-end justify-center gap-1">
              {micEnabled
                ? micVolume.map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-[3px] bg-[#7cf0c8] transition-all duration-100"
                      style={{ height: h, opacity: 0.6 + (h / 28) * 0.4 }}
                    />
                  ))
                : (
                  <span className="font-mono text-[10px] text-white/20 tracking-[0.08em]">
                    Enable mic to see audio levels
                  </span>
                )
              }
            </div>

            {/* Device selectors */}
            <div className="flex flex-col gap-2.5 mt-5">
              {[
                { label: "Microphone", value: selectedMic, setter: setSelectedMic, devices: micDevices, defaultLabel: "Default microphone" },
                { label: "Camera",     value: selectedCam, setter: setSelectedCam, devices: camDevices, defaultLabel: "Default camera" },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-1">
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/30">{row.label}</div>
                  <select
                    className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-3.5 py-2.5 text-white/75 text-xs outline-none cursor-pointer transition-all appearance-none hover:border-[#7cf0c8]/30 hover:bg-[#7cf0c8]/4 focus:border-[#7cf0c8]/30"
                    value={row.value}
                    onChange={(e) => row.setter(e.target.value)}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: 34,
                    }}
                  >
                    <option value="">{row.defaultLabel}</option>
                    {row.devices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId} style={{ background: "#111118", color: "#e2e2ee" }}>
                        {d.label || `${row.label} ${d.deviceId.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Checks + info */}
          <div className="p-7 md:p-9 border-t md:border-t-0 md:border-l border-neutral-800">
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/30 mb-4">
              System checks
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {checks.map((c) => (
                <div
                  key={c.id}
                  className={statusRowCls(c.status)}
                  onClick={() => handleCheckClick(c.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckClick(c.id)}
                >
                  <div className={statusIconWrapCls(c.status)}>{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white/85">{c.name}</div>
                    <div className="font-mono text-[10px] text-white/30 mt-0.5 tracking-[0.04em]">{c.sub}</div>
                  </div>
                  <span className={statusBadgeCls(c.status)}>{badgeLabel(c.status)}</span>
                </div>
              ))}
            </div>

            {/* Interview details */}
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/30 mb-3 mt-5">
              Interview details
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { label: "~30 min",       color: "#7cf0c8" },
                { label: "Technical · DSA", color: "#7c8cf0" },
                { label: "5 questions",   color: "#f0c87c" },
                { label: "AI interviewer", color: "#f07ca0" },
              ].map((chip) => (
                <div key={chip.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700/50 bg-neutral-800/40 text-xs text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: chip.color }} />
                  {chip.label}
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-800/30">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/25 mb-2">Tips</div>
              {tips.map((tip, i) => (
                <div key={i} className={`flex gap-2.5 text-xs text-white/45 leading-relaxed ${i < tips.length - 1 ? "mb-2" : ""}`}>
                  <span className="text-[#7cf0c8] font-mono flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Readiness banner ── */}
        <div className={[
          "mx-9 mb-5 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs border",
          isReady
            ? "bg-[#7cf0c8]/7 border-[#7cf0c8]/20 text-[#7cf0c8]/85"
            : "bg-amber-400/6 border-amber-300/50 text-amber-300/80",
        ].join(" ")}>
          <span className="text-base">{isReady ? "✅" : "⚠️"}</span>
          <span>
            {isReady
              ? "All checks passed — you're good to go!"
              : "Enable your mic and camera, then verify all checks are green before proceeding."}
          </span>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between flex-wrap gap-4 px-9 py-6 border-t border-neutral-800">
          <div className="font-mono text-[10px] text-white/20 tracking-[0.06em]">
            Checks: <span className="text-[#7cf0c8]/50">{passCount}</span>/{checks.length} passed
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="font-mono text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded-xl border border-neutral-700/50 bg-transparent text-white/40 cursor-pointer transition-all hover:border-neutral-700/60 hover:text-white/70 hover:bg-neutral-800/50"
            >
              Cancel
            </button>
            <button
              disabled={!isReady}
              onClick={() => navigate("/mock-interview/session")}
              className="flex items-center gap-2 text-[13px] font-semibold px-7 py-3 rounded-2xl border-none bg-gradient-to-br from-[#7cf0c8] to-[#5ad4a8] text-[#07140f] cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(124,240,200,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Proceed to interview
              <span className="text-base transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}