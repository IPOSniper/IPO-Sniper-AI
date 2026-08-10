interface MetricProps {
  label: string;
  value: string | number;
  color?: "default" | "green" | "red" | "cyan" | "amber";
}

export default function Metric({
  label,
  value,
  color = "default",
}: MetricProps) {
  const colors = {
    default: "text-white",
    green: "text-green-400",
    red: "text-red-400",
    cyan: "text-cyan-400",
    amber: "text-amber-400",
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className={`text-lg font-bold ${colors[color]}`}>
        {value}
      </span>
    </div>
  );
}