interface BadgeProps {
  children: React.ReactNode;
  color?: "green" | "blue" | "yellow" | "red";
}

const colors = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
};

export default function Badge({
  children,
  color = "blue",
}: BadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold ${colors[color]}`}
    >
      {children}
    </span>
  );
}