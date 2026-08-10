import clsx from "clsx";

type Variant = "buy" | "hold" | "sell" | "info";

export default function StatusChip({
  label,
  variant,
}: {
  label: string;
  variant: Variant;
}) {
  const colors = {
    buy: "bg-green-500/20 text-green-400 border-green-500/30",
    hold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    sell: "bg-red-500/20 text-red-400 border-red-500/30",
    info: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };

  return (
    <span
      className={clsx(
        "px-3 py-1 rounded-full border text-xs font-semibold",
        colors[variant]
      )}
    >
      {label}
    </span>
  );
}
