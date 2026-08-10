type DashboardCardProps = {
  title: string;
  children: React.ReactNode;
};

export default function DashboardCard({
  title,
  children,
}: DashboardCardProps) {
  return (
    <div className="bg-slate-900 rounded-xl p-6">
      <h2 className="text-cyan-400 font-bold text-xl mb-4">
        {title}
      </h2>

      {children}
    </div>
  );
}