import { cn } from "../../lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-900 backdrop-blur transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-none focus-visible:border-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}