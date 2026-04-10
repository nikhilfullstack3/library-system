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

  return (
    <aside
      className={cn(
        "relative flex h-screen sticky top-0 flex-col border-r border-slate-200/60 bg-white/70 backdrop-blur-2xl transition-all duration-300",
        collapsed ? "w-[88px]" : "w-[272px]"
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/40 via-transparent to-teal-50/30" />

      {/* Brand */}
      <div className="relative flex items-center justify-between border-b border-slate-200/60 px-4 py-5">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <SquareLibrary className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 ring-2 ring-white">
              <Sparkles className="h-2 w-2 text-white" />
            </span>
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="font-display text-base font-extrabold tracking-tight text-slate-900">
                Studyly
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                Library System
              </p>
            </div>
          ) : null}
        </div>
        <button
          onClick={onToggle}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <div className="relative flex-1 overflow-y-auto px-3 py-5">
        <p
          className={cn(
            "px-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400",
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
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
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
                        isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-600"
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

      {/* User card */}
      <div className="relative border-t border-slate-200/60 p-3">
        {!collapsed ? (
          <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-extrabold text-white shadow-md shadow-emerald-500/30">
                {(session?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-slate-900">{session?.name || "User"}</p>
                <p className="truncate text-[10px] font-medium text-slate-500">
                  {libraryData?.library?.name || "Library"}
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-rose-500"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white shadow-md shadow-emerald-500/30"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}