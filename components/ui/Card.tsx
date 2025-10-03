import clsx from "clsx";

export default function Card({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-card)] shadow-[var(--shadow)] border border-black/5 dark:border-white/10 bg-[hsl(var(--bg-snow))] dark:bg-[#111827]",
        className
      )}
    >
      {children}
    </div>
  );
}