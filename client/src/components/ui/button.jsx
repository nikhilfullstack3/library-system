import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl text-sm font-bold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
        outline:
          "border border-slate-200 bg-white/80 text-slate-700 backdrop-blur hover:bg-white hover:border-slate-300",
        ghost: "text-slate-600 hover:bg-slate-100",
        destructive:
          "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Button({ asChild = false, className, size, variant, ...props }) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}

export { buttonVariants };