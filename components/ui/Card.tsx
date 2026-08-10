import { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({
  title,
  children,
  className = "",
}: CardProps) {
  return (
    <section
      className={`
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        shadow-lg
        transition-all
        duration-300
        hover:border-cyan-500/40
        hover:shadow-cyan-500/10
        ${className}
      `}
    >
      {title && (
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>
        </div>
      )}

      <div className="p-6">
        {children}
      </div>
    </section>
  );
}