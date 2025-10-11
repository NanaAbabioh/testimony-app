import clsx from "clsx";
import * as React from "react";

export function Card({ className, children }: React.PropsWithChildren<{ className?: string }>) {
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

export function CardHeader({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("p-6 pb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h3 className={clsx("text-xl font-semibold leading-none tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <p className={clsx("text-sm text-gray-600 dark:text-gray-400 mt-1.5", className)}>
      {children}
    </p>
  );
}

export function CardContent({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("p-6 pt-0", className)}>
      {children}
    </div>
  );
}

// Default export for backward compatibility
export default Card;