import {
  BarChart3,
  MessageCircleMore,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  UserPlus,
  Rows3,
  Sparkles,
  SquareLibrary,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../lib/utils";

const links = [
  { label: "Dashboard", to: "/librarian", icon: LayoutDashboard },
  { label: "Analytics", to: "/librarian/analytics", icon: BarChart3 },
  { label: "Students", to: "/librarian/students", icon: Users },
  { label: "Registration", to: "/librarian/registration", icon: UserPlus },
  { label: "Seats", to: "/librarian/seats", icon: Rows3 },
  { label: "Attendance", to: "/librarian/attendance", icon: SquareLibrary },
  { label: "Documents", to: "/librarian/documents", icon: FileText },
  { label: "Chat", to: "/librarian/chat", icon: MessageCircleMore },
];

export function AppSidebar({ collapsed, onToggle }) {
  const { logout, session, libraryData } = useAuth();
  const { isMidnightJelly } = useTheme();

  return (
    <aside
      className={cn(
        "relative flex h-screen sticky top-0 flex-col backdrop-blur-2xl transition-all duration-300",
        isMidnightJelly
          ? "border-r border-white/10 bg-[#120f23]/70"
          : "border-r border-slate-200/60 bg-white/70",
        collapsed ? "w-[88px]" : "w-[272px]"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          isMidnightJelly
            ? "bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_34%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.12),transparent_28%)]"
            : "bg-gradient-to-b from-emerald-50/40 via-transparent to-teal-50/30"
        )}
      />

      <div className={cn("relative flex items-center justify-between px-4 py-5", isMidnightJelly ? "border-b border-white/10" : "border-b border-slate-200/60")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg",
              isMidnightJelly
                ? "bg-gradient-to-br from-violet-500 to-cyan-400 shadow-violet-500/30"
                : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30"
            )}
          >
            <SquareLibrary className="h-5 w-5" />
            <span className={cn("absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400", isMidnightJelly ? "ring-2 ring-[#120f23]" : "ring-2 ring-white")}>
              <Sparkles className="h-2 w-2 text-white" />
            </span>
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className={cn("font-display text-base font-extrabold tracking-tight", isMidnightJelly ? "text-violet-50" : "text-slate-900")}>
                Studyly
              </p>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest", isMidnightJelly ? "text-cyan-300" : "text-emerald-600")}>
                Library System
              </p>
            </div>
          ) : null}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "rounded-xl p-2",
            isMidnightJelly ? "text-violet-200 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto px-3 py-5">
        <p
          className={cn(
            "px-3 text-[10px] font-extrabold uppercase tracking-[0.22em]",
            isMidnightJelly ? "text-violet-200/50" : "text-slate-400",
            collapsed && "text-center"
          )}
        >
          {collapsed ? "·" : "Navigation"}
        </p>
        <nav className="mt-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
                    isActive
                      ? isMidnightJelly
                        ? "bg-gradient-to-r from-violet-500 to-cyan-400 text-white shadow-md shadow-violet-500/25"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                      : isMidnightJelly
                        ? "text-violet-100/80 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                    collapsed && "justify-center"
                  )
                }
                end={link.to === "/librarian"}
                to={link.to}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110",
                        isActive
                          ? "text-white"
                          : isMidnightJelly
                            ? "text-violet-200/70 group-hover:text-cyan-300"
                            : "text-slate-500 group-hover:text-emerald-600"
                      )}
                    />
                    {!collapsed ? <span>{link.label}</span> : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className={cn("relative p-3", isMidnightJelly ? "border-t border-white/10" : "border-t border-slate-200/60")}>
        {!collapsed ? (
          <div
            className={cn(
              "rounded-2xl border p-3",
              isMidnightJelly
                ? "border-white/10 bg-gradient-to-br from-violet-500/12 to-cyan-400/10"
                : "border-slate-200/60 bg-gradient-to-br from-emerald-50 to-teal-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-white shadow-md",
                  isMidnightJelly
                    ? "bg-gradient-to-br from-violet-500 to-cyan-400 shadow-violet-500/30"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30"
                )}
              >
                {(session?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-xs font-extrabold", isMidnightJelly ? "text-violet-50" : "text-slate-900")}>{session?.name || "User"}</p>
                <p className={cn("truncate text-[10px] font-medium", isMidnightJelly ? "text-violet-100/65" : "text-slate-500")}>
                  {libraryData?.library?.name || "Library"}
                </p>
              </div>
              <button
                onClick={logout}
                className={cn(
                  "rounded-xl p-1.5",
                  isMidnightJelly ? "text-violet-100/70 hover:bg-white/10 hover:text-rose-300" : "text-slate-400 hover:bg-white hover:text-rose-500"
                )}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center justify-center rounded-2xl p-3 text-white shadow-md",
              isMidnightJelly
                ? "bg-gradient-to-br from-violet-500 to-cyan-400 shadow-violet-500/30"
                : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30"
            )}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
