import {
  MessageCircleMore,
  FileText,
  LayoutDashboard,
  Menu,
  UserPlus,
  Rows3,
  SquareLibrary,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const links = [
  { label: "Dashboard", to: "/librarian", icon: LayoutDashboard },
  { label: "Students", to: "/librarian/students", icon: Users },
  { label: "Registration", to: "/librarian/registration", icon: UserPlus },
  { label: "Seats", to: "/librarian/seats", icon: Rows3 },
  { label: "Attendance", to: "/librarian/attendance", icon: SquareLibrary },
  { label: "Documents", to: "/librarian/documents", icon: FileText },
  { label: "Chat", to: "/librarian/chat", icon: MessageCircleMore },
];

export function AppSidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-emerald-100 bg-white/90 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[88px]" : "w-[280px]"
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <SquareLibrary className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div>
              <p className="text-sm font-semibold text-slate-900">Study Room LMS</p>
              <p className="text-xs text-slate-500">Library management</p>
            </div>
          ) : null}
        </div>
        <Button onClick={onToggle} size="icon" variant="ghost">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 px-3 py-4">
        <p className={cn("px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400", collapsed && "text-center")}>
          {collapsed ? "Nav" : "Navigation"}
        </p>
        <nav className="mt-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                    isActive ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-slate-900",
                    collapsed && "justify-center"
                  )
                }
                end={link.to === "/librarian"}
                to={link.to}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed ? <span>{link.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
