import { cn } from "../../lib/utils";
import { useTheme } from "../../context/ThemeContext";

export function Label({ className, ...props }) {
  const { isMidnightJelly } = useTheme();

  return <label className={cn("text-sm font-medium", isMidnightJelly ? "text-violet-100/85" : "text-slate-700", className)} {...props} />;
}
