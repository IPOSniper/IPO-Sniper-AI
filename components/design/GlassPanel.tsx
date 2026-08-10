import { ReactNode } from "react";
import clsx from "clsx";

type GlassPanelProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function GlassPanel({
  title,
  subtitle,
  children,
  className,
}: GlassPanelProps) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-lg p-6",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-lg font-semibold text-white">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="text-sm text-zinc-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
