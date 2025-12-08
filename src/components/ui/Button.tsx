"use client";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
};

export default function Button({
  className, variant="solid", size="md", ...props
}: Props) {
  const sizing = size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-[15px]";
  const base = "inline-flex items-center justify-center rounded-[var(--radius-btn)] transition-[transform,box-shadow,background-color] duration-150 ease-out focus-ring";
  const motion = "hover:shadow-[var(--shadow-hover)] active:scale-[1.03]"; // Motion B
  const styles = {
    solid: "bg-[hsl(var(--brand))] text-white shadow-[var(--shadow)] hover:opacity-95",
    outline: "border border-black/10 dark:border-white/15 text-[hsl(var(--ink))] bg-white/50 dark:bg-white/5",
    ghost: "text-[hsl(var(--ink))] bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
  }[variant];

  return <button className={clsx(base, sizing, motion, styles, className)} {...props} />;
}