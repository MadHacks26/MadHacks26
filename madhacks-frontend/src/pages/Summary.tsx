import { useNavigate } from "react-router-dom";

const pageWrap =
  "min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white";
const container = "mx-auto w-full max-w-4xl px-4 py-16 sm:px-6";

const buttonPrimary =
  "inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]";

export default function Summary() {
  const navigate = useNavigate();

  return (
    <div className={pageWrap}>
      <div className={container}>
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Summary
          </h1>

          <p className="max-w-prose text-lg text-gray-600 dark:text-gray-400">
            Your personalized roadmap is generated and ready for review.
          </p>

          <button
            className={buttonPrimary}
            onClick={() => navigate("/dashboard")}
          >
            View my roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
