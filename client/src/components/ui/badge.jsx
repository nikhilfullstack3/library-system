import { cva } from "class-variance-authority";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
        secondary: "border-slate-200/70 bg-slate-100 text-slate-700",
        success: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
        destructive: "border-rose-200/70 bg-rose-50 text-rose-700",
        warning: "border-amber-200/70 bg-amber-50 text-amber-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  const { isMidnightJelly } = useTheme();

  const jellyClass =
    variant === "warning"
      ? "border-fuchsia-300/20 bg-fuchsia-500/10 text-fuchsia-100"
      : variant === "destructive"
        ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
        : variant === "success" || variant === "default"
          ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
          : "border-white/10 bg-white/10 text-violet-100";

  return <div className={cn(badgeVariants({ variant }), isMidnightJelly && jellyClass, className)} {...props} />;
}
