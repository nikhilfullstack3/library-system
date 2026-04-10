import { cva } from "class-variance-authority";
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
  return <div className={cn(badgeVariants({ className, variant }))} {...props} />;
}