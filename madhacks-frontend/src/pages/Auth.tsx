import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const pageWrap =
  "min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white flex flex-col items-center justify-center px-4";
const card =
  "w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm";
const buttonPrimary =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
const buttonGhost =
  "inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 active:scale-[0.99]";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, error, isConfigured, login, logout } = useAuth();
  const [submitLoading, setSubmitLoading] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) {
  //     // navigate("/", { replace: true });
        // logout().then(() => {})
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setSubmitLoading(true);
    try {
      const cred = await login();
      const user = cred.user;
      await fetch(`${API_BASE}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uid,
          user_name: user.displayName || user.email || "User",
          email: user.email || "",
        })
      }).then(async function(response) {
        console.log(response.status);
        if(response.status == 200) {
          navigate("/", { replace: true });
        }
        else {
          await logout();
          setSubmitLoading(false);
        }
      });
    } catch {
      console.log("Error connecting to server!!")
      await logout();
      // error is set in context
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={pageWrap}>
        <div className="text-sm text-neutral-500">Loading…</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  if (!isConfigured) {
    return (
      <div className={pageWrap}>
        <div className={card}>
          <h1 className="text-xl font-bold text-neutral-900">Auth</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Firebase Auth is not configured. Add VITE_FIREBASE_* env variables
            to enable login.
          </p>
          {/* <button
            type="button"
            className={`${buttonGhost} mt-6`}
            onClick={() => navigate("/")}
          >
            Back to home
          </button> */}
        </div>
      </div>
    );
  }

  return (
    <div className={pageWrap}>
      <div className={card}>
        <h1 className="text-xl font-bold text-neutral-900">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in with your Google account to continue.
        </p>

        <div className="mt-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600" role="alert">
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

      {/* <button
        type="button"
        className={`${buttonGhost} mt-4 max-w-md`}
        onClick={() => navigate("/")}
      >
        Back to home
      </button> */}
    </div>
  );
}
