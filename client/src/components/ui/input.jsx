import { cn } from "../../lib/utils";
import { useTheme } from "../../context/ThemeContext";

export function Input({ className, ...props }) {
  const { isMidnightJelly } = useTheme();

  return (
    <input
      className={cn(
        isMidnightJelly
          ? "flex h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-violet-50 backdrop-blur transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-violet-100/45 hover:border-violet-300/30 focus-visible:outline-none focus-visible:border-violet-300 focus-visible:ring-4 focus-visible:ring-violet-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          : "flex h-11 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-900 backdrop-blur transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-none focus-visible:border-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
