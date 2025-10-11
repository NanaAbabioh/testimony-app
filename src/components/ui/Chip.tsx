"use client";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: React.ReactNode;
};

export default function Chip({
  className, active = false, children, ...props
}: Props) {
  const base = "inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-full transition-colors duration-150 ease-out";
  const states = active 
    ? "bg-[hsl(var(--brand))] text-white shadow-sm" 
    : "bg-black/5 dark:bg-white/10 text-[hsl(var(--ink))] hover:bg-black/10 dark:hover:bg-white/15";

  return (
    <button 
      className={clsx(base, states, className)} 
      {...props}
    >
      {children}
    </button>
  );
}