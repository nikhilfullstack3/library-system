import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { useTheme } from "../../context/ThemeContext";
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
  const { isMidnightJelly } = useTheme();

  const jellyVariantClass =
    variant === "default"
      ? "bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:brightness-110"
      : variant === "secondary"
        ? "bg-white/10 text-violet-50 hover:bg-white/15"
        : variant === "outline"
          ? "border border-white/10 bg-white/10 text-violet-100 backdrop-blur hover:bg-white/15 hover:border-violet-300/30"
          : variant === "ghost"
            ? "text-violet-100 hover:bg-white/10"
            : "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30";

  return (
    <Comp
      className={cn(buttonVariants({ size, variant }), isMidnightJelly && jellyVariantClass, className)}
      {...props}
    />
  );
}

export { buttonVariants };
