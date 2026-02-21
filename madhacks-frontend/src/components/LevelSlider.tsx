import * as React from "react";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  leftLabel?: string;
  rightLabel?: string;
};

export default function LevelSlider({
  label,
  value,
  onChange,
  leftLabel = "New",
  rightLabel = "Strong",
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">{label}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Rate your comfort level (0 to 10)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-lg bg-neutral-100 px-2 text-sm font-semibold text-neutral-900">
            {value}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <input
          aria-label={label}
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-neutral-900"
        />

        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}