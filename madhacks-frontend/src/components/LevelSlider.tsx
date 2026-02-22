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
    <div className="rounded-xl border-2 border-[#202026] bg-[#090b10] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-white uppercase">{label}</p>
          <p className="mt-1 text-[0.7rem] text-neutral-300">
            Rate your comfort level (0 to 10)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-lg bg-neutral-100 px-2 text-sm font-semibold text-neutral-900">
            {value}
          </span>
        </div>
      </div>

      <div className="mt-2">
        <input
          aria-label={label}
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-white slider-white cursor-pointer"
        />

        <div className="mt-2 flex items-center justify-between text-[13px] text-neutral-300">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}