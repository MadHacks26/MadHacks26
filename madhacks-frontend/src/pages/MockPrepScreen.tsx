import * as React from "react";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Globe, Signal } from "lucide-react";

type CheckStatus = "idle" | "ok" | "warn" | "err";

interface Check {
  id: string;
  icon: ReactNode;
  name: string;
  sub: string;
  status: CheckStatus;
}

function statusRowCls(s: CheckStatus) {
  if (s === "ok")
    return "flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#7aecc4]/20 bg-[#7aecc4]/5 cursor-pointer select-none transition-all";
  if (s === "warn")
    return "flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-amber-500/20 bg-amber-500/5 cursor-pointer select-none transition-all";
  if (s === "err")
    return "flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-red-600/20 bg-red-600/5 cursor-pointer select-none transition-all";
  return "flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#202026] bg-[#090b10] cursor-pointer select-none transition-all hover:border-[#2a2a32]";
}

function statusIconWrapCls(s: CheckStatus) {
  if (s === "ok")
    return "w-9 h-9 rounded-lg flex items-center justify-center text-base bg-[#7aecc4]/10 border-2 border-[#7aecc4]/20 flex-shrink-0";
  if (s === "warn")
    return "w-9 h-9 rounded-lg flex items-center justify-center text-base bg-amber-500/10 border-2 border-amber-500/20 flex-shrink-0";
  if (s === "err")
    return "w-9 h-9 rounded-lg flex items-center justify-center text-base bg-red-600/10 border-2 border-red-600/20 flex-shrink-0";
  return "w-9 h-9 rounded-lg flex items-center justify-center text-base bg-[#090b10] border-2 border-[#202026] flex-shrink-0";
}

function statusBadgeCls(s: CheckStatus) {
  if (s === "ok")
    return "rounded-full px-2.5 py-1 text-xs font-semibold border-none bg-[#7aecc4]/10 text-[#7aecc4]";
  if (s === "warn")
    return "rounded-full px-2.5 py-1 text-xs font-semibold border-none bg-amber-500/10 text-amber-400";
  if (s === "err")
    return "rounded-full px-2.5 py-1 text-xs font-semibold border-none bg-red-600/10 text-red-400";
  return "rounded-full px-2.5 py-1 text-xs font-semibold border-none bg-[#090b10] text-neutral-500";
}

function badgeLabel(s: CheckStatus) {
  if (s === "ok") return "OK";
  if (s === "warn") return "WARN";
  if (s === "err") return "FAIL";
  return "IDLE";
}

const buttonPrimary =
  "inline-flex items-center justify-center bg-[#7aecc4] text-black tracking-wide rounded-xl px-6 py-3 text-sm font-semibold transition hover:bg-[#1c2b2b] hover:text-white active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed";

const buttonGhost =
  "inline-flex items-center justify-center rounded-xl bg-[#1c2b2b] text-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-800 active:scale-[0.99]";

function truncateLabel(label: string, max = 34) {
  const clean = label.trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + "…";
}

export default function MockPrepScreen() {
  const navigate = useNavigate();

  const streamRef = React.useRef<MediaStream | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number>(0);

  const [micEnabled, setMicEnabled] = React.useState(false);
  const [micVolume, setMicVolume] = React.useState<number[]>(Array(12).fill(4));
  const [micDevices, setMicDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = React.useState("");

  const [checks, setChecks] = React.useState<Check[]>([
    {
      id: "mic",
      icon: <Mic size={20} color="#7aecc4" />,
      name: "Microphone",
      sub: "Click to test",
      status: "idle",
    },
    {
      id: "browser",
      icon: <Globe size={20} color="#7aecc4" />,
      name: "Browser",
      sub: "Checking…",
      status: "idle",
    },
    {
      id: "network",
      icon: <Signal size={20} color="#7aecc4" />,
      name: "Network",
      sub: "Checking connectivity…",
      status: "idle",
    },
  ]);

  React.useEffect(() => {
    const supported = !!navigator.mediaDevices?.getUserMedia;
    updateCheck(
      "browser",
      supported ? "ok" : "err",
      supported ? "Supported" : "Not Supported"
    );
    updateCheck(
      "network",
      navigator.onLine ? "ok" : "err",
      navigator.onLine ? "Connected" : "No Connection"
    );

    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devs) =>
        setMicDevices(devs.filter((d) => d.kind === "audioinput"))
      );

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
      updateCheck("mic", "ok", "Microphone Active");

      const devs = await navigator.mediaDevices.enumerateDevices();
      setMicDevices(devs.filter((d) => d.kind === "audioinput"));

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

  const isReady = checks.every((c) => c.status === "ok" || c.status === "warn");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-semibold tracking-wide text-[#7aecc4]">
          MOCK INTERVIEW
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-white">
          Before we begin, verify your setup.
        </h1>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="w-full max-w-full overflow-hidden rounded-2xl border-2 border-[#202026] bg-black p-5">
            <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4">
              Microphone Test
            </p>

            <div className="h-10 flex items-center justify-center gap-1 rounded-xl border-2 border-[#202026] bg-[#090b10] px-3 py-2 mb-4">
              {micEnabled ? (
                <div className="flex items-end gap-1 h-full">
                  {micVolume.map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-sm bg-[#7aecc4] transition-all duration-100"
                      style={{ height: h, opacity: 0.6 + (h / 28) * 0.4 }}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-xs text-neutral-400">
                  Microphone not enabled
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-white uppercase tracking-wide mb-1.5">
              Device
            </p>

            <select
              className="w-full max-w-full min-w-0 truncate overflow-hidden text-ellipsis bg-[#090b10] border-2 border-[#202026] rounded-xl px-3 py-2.5 text-white text-sm outline-none cursor-pointer transition-all appearance-none hover:border-[#7aecc4]/30 focus:border-[#7aecc4]/40"
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: 34,
              }}
            >
              <option value="">Default Microphone</option>
              {micDevices.map((d) => {
                const label =
                  d.label && d.label.trim().length > 0
                    ? truncateLabel(d.label, 40)
                    : `Microphone ${d.deviceId.slice(0, 6)}`;
                return (
                  <option
                    key={d.deviceId}
                    value={d.deviceId}
                    style={{ background: "#090b10" }}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="rounded-2xl border-2 border-[#202026] bg-black p-5">
            <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4">
              System Checks
            </p>

            <div className="flex flex-col gap-2.5">
              {checks.map((c) => (
                <div
                  key={c.id}
                  className={statusRowCls(c.status)}
                  onClick={() => {
                    if (c.id === "mic") toggleMic();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && c.id === "mic" && toggleMic()
                  }
                >
                  <div className={statusIconWrapCls(c.status)}>{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">
                      {c.name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {c.sub}
                    </div>
                  </div>
                  <span className={statusBadgeCls(c.status)}>
                    {badgeLabel(c.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border-2 border-[#202026] bg-black p-5">
          <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4">
            Interview Details
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-2 text-white">
            {[
              { label: "Duration", value: "~ 15 mins" },
              { label: "Questions", value: "3" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border-2 border-[#202026] bg-[#090b10] px-3 py-3"
              >
                <p className="text-xs text-neutral-300 font-semibold uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button className={buttonGhost} onClick={() => navigate("/roadmap")}>
            Back
          </button>

          <button
            className={buttonPrimary}
            disabled={!isReady}
            onClick={() => navigate("/mock-interview/session")}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
