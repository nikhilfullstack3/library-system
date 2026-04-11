import { cn } from "../../lib/utils";
import { useTheme } from "../../context/ThemeContext";

export function Card({ className, ...props }) {
  const { isMidnightJelly } = useTheme();

  return (
    <div
      className={cn(
        isMidnightJelly
          ? "rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_24px_80px_rgba(14,10,28,0.38)]"
          : "rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  const { isMidnightJelly } = useTheme();

  return <h3 className={cn("text-lg font-bold tracking-tight", isMidnightJelly ? "text-violet-50" : "text-slate-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  const { isMidnightJelly } = useTheme();

  return <p className={cn("text-sm", isMidnightJelly ? "text-violet-100/70" : "text-slate-500", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
