interface ProgressBarProps {
  value: number;
}

export default function ProgressBar({
  value,
}: ProgressBarProps) {
  return (
    <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
      <div
        className="h-3 rounded-full bg-blue-600 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}