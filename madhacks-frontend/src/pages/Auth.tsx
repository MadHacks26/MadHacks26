// src/pages/Auth.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import BackgroundCircles from "@/components/BackgroundCircles";
import { EncryptedText } from "@/components/ui/encrypted-text";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const pageWrap =
  "relative min-h-screen bg-[#090b10] flex flex-col items-center justify-center px-4 overflow-hidden";

const buttonPrimary =
  "inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#7aecc4] text-black px-5 py-3 text-sm font-semibold transition hover:bg-white active:scale-[0.99] disabled:cursor-not-allowed";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, error, isConfigured, login, logout } = useAuth();
  const [submitLoading, setSubmitLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setSubmitLoading(true);
    try {
      const cred = await login();
      const u = cred.user;

      const res = await fetch(`${API_BASE}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: u.uid,
          user_name: u.displayName || u.email || "User",
          email: u.email || "",
        }),
      });

      if (res.status === 200) {
        navigate("/", { replace: true });
      } else {
        await logout();
      }
    } catch {
      console.log("Error connecting to server!!");
      await logout();
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={pageWrap}>
        <BackgroundCircles />
        <div className="relative z-10 text-sm text-neutral-400">Loading…</div>
      </div>
    );
  }

  if (user) return null;

  if (!isConfigured) {
    return (
      <div className={pageWrap}>
        <BackgroundCircles />
        <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-xl font-bold text-white">Auth</h1>
          <p className="mt-2 text-sm text-neutral-300">
            Firebase Auth is not configured. Add VITE_FIREBASE_* env variables to enable login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageWrap}>
      <BackgroundCircles />

      <div className="relative z-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center">
          <EncryptedText
            text="JASPER.AI"
            revealDelayMs={70}
            flipDelayMs={25}
            loop
            loopDelayMs={1400}
            encryptedClassName="text-white/35"
            revealedClassName="text-white"
          />
        </h1>

        <div className="mt-8 space-y-4 flex flex-col items-center">
          {error && (
            <p className="text-sm text-red-400 text-center" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className={buttonPrimary}
            onClick={handleGoogleSignIn}
            disabled={submitLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {submitLoading ? "Signing in…" : "Sign in with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}