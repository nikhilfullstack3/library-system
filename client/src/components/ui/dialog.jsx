import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogPortal(props) {
  return <DialogPrimitive.Portal {...props} />;
}

export function DialogOverlay({ className, ...props }) {
  const { isMidnightJelly } = useTheme();

  return <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 backdrop-blur-sm", isMidnightJelly ? "bg-[#05040b]/70" : "bg-slate-950/45", className)} {...props} />;
}

export function DialogContent({ className, children, ...props }) {
  const { isMidnightJelly } = useTheme();

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl p-6 shadow-xl duration-200",
          isMidnightJelly ? "border border-white/10 bg-[#120f23] text-violet-50" : "border border-slate-200 bg-white",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className={cn("absolute right-4 top-4 rounded-md p-1 transition", isMidnightJelly ? "text-violet-200/70 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900")}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-2 text-left", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  const { isMidnightJelly } = useTheme();

  return <DialogPrimitive.Title className={cn("text-lg font-semibold", isMidnightJelly ? "text-violet-50" : "text-slate-900", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  const { isMidnightJelly } = useTheme();

  return <DialogPrimitive.Description className={cn("text-sm", isMidnightJelly ? "text-violet-100/70" : "text-slate-500", className)} {...props} />;
}
