import { BarChart3, FileText, LayoutDashboard, LogOut, Menu, MessageCircleMore, MoonStar, Rows3, Search, SquareLibrary, UserPlus, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { AppSidebar } from "./AppSidebar";

const mobileLinks = [
  { label: "Dashboard", to: "/librarian", icon: LayoutDashboard },
  { label: "Students", to: "/librarian/students", icon: Users },
  { label: "Registration", to: "/librarian/registration", icon: UserPlus },
  { label: "Seats", to: "/librarian/seats", icon: Rows3 },
  { label: "Attendance", to: "/librarian/attendance", icon: SquareLibrary },
  { label: "Documents", to: "/librarian/documents", icon: FileText },
  { label: "Analytics", to: "/librarian/analytics", icon: BarChart3 },
  { label: "Chat", to: "/librarian/chat", icon: MessageCircleMore },
];

export function DashboardShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { libraryData, logout, session } = useAuth();
  const { isMidnightJelly, toggleMidnightJelly } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const searchOriginRef = useRef("");

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("search") || "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const trimmedValue = searchTerm.trim();

    if (!trimmedValue) {
      if (location.pathname === "/librarian/students" && searchOriginRef.current) {
        const origin = searchOriginRef.current;
        searchOriginRef.current = "";
        navigate(origin, { replace: true });
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (location.pathname !== "/librarian/students" && !searchOriginRef.current) {
        searchOriginRef.current = `${location.pathname}${location.search}`;
      }

      const nextPath = trimmedValue ? `/librarian/students?search=${encodeURIComponent(trimmedValue)}` : "/librarian/students";
      const currentPath = `${location.pathname}${location.search}`;

      if (currentPath !== nextPath) {
        navigate(nextPath, { replace: true });
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.search, navigate, searchTerm]);

  return (
    <div className={`h-dvh flex flex-col ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header
            className={`shrink-0 z-20 border-b backdrop-blur-2xl ${
              isMidnightJelly
                ? "border-white/10 bg-[#120f23]/70"
                : "border-slate-200/60 bg-white/70"
            }`}
          >
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              {/* Hamburger — mobile only */}
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition md:hidden ${
                  isMidnightJelly
                    ? "bg-white/10 text-violet-100 hover:bg-white/15"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <h1
                  className={`truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl ${
                    isMidnightJelly ? "text-violet-50" : "text-slate-900"
                  }`}
                >
                  <span>{libraryData?.library?.name || "Studyly Library"}</span>
                </h1>
              </div>

              <div className={`hidden flex-1 max-w-md sm:block ${location.pathname === "/librarian/chat" ? "invisible" : ""}`}>
                <div
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-sm transition-all ${
                    isMidnightJelly
                      ? "border-white/10 bg-white/10 text-violet-50 focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-400/15"
                      : "border-slate-200 bg-white/80 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100"
                  }`}
                >
                  <Search className={`h-4 w-4 shrink-0 ${isMidnightJelly ? "text-violet-200/70" : "text-slate-400"}`} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className={`w-full bg-transparent text-sm outline-none ${
                      isMidnightJelly ? "placeholder:text-violet-200/50" : "placeholder:text-slate-400"
                    }`}
                    placeholder="Search students by name or number…"
                  />
                  {searchTerm && (
                    <kbd
                      className={`hidden rounded-lg px-1.5 py-0.5 text-[10px] font-bold sm:inline ${
                        isMidnightJelly ? "bg-white/10 text-violet-100" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      ⌘K
                    </kbd>
                  )}
                </div>
              </div>

              <button
                onClick={toggleMidnightJelly}
                type="button"
                aria-label="Toggle Midnight Jelly"
                className="flex items-center gap-2 rounded-full px-1 py-1 transition"
              >
                <MoonStar className={`h-4 w-4 ${isMidnightJelly ? "text-violet-300" : "text-slate-400"}`} />
                <span
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                    isMidnightJelly ? "bg-linear-to-r from-violet-500 to-cyan-400" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
                      isMidnightJelly ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* Mobile search bar */}
            <div className={`px-4 pb-3 sm:hidden ${location.pathname === "/librarian/chat" ? "hidden" : ""}`}>
              <div
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-sm ${
                  isMidnightJelly
                    ? "border-white/10 bg-white/10 focus-within:border-violet-300"
                    : "border-slate-200 bg-white/80 focus-within:border-emerald-400"
                }`}
              >
                <Search className={`h-4 w-4 shrink-0 ${isMidnightJelly ? "text-violet-200/70" : "text-slate-400"}`} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={`w-full bg-transparent text-sm outline-none ${
                    isMidnightJelly ? "text-violet-50 placeholder:text-violet-200/50" : "placeholder:text-slate-400"
                  }`}
                  placeholder="Search students…"
                />
              </div>
            </div>
          </header>

          <main className={`flex-1 overflow-y-auto ${location.pathname === "/librarian/chat" ? "p-0 overflow-hidden" : "px-4 py-6 sm:px-6 lg:px-8"}`}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile slide-out drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } ${isMidnightJelly ? "bg-[#120f23]" : "bg-white"}`}
      >
        {/* Drawer header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${isMidnightJelly ? "border-white/10" : "border-slate-200"}`}>
          <span className={`font-display text-base font-extrabold tracking-tight ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
            {libraryData?.library?.name || "Studyly Library"}
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
              isMidnightJelly ? "text-violet-200 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {mobileLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/librarian"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      isActive
                        ? isMidnightJelly
                          ? "bg-linear-to-r from-violet-500/20 to-cyan-400/10 text-violet-100 shadow-sm"
                          : "bg-linear-to-r from-emerald-50 to-teal-50 text-emerald-700"
                        : isMidnightJelly
                          ? "text-violet-200/70 hover:bg-white/8 hover:text-violet-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isActive
                          ? isMidnightJelly
                            ? "bg-linear-to-br from-violet-500 to-cyan-400 text-white shadow-md shadow-violet-500/25"
                            : "bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                          : isMidnightJelly
                            ? "bg-white/8 text-violet-200/70"
                            : "bg-slate-100 text-slate-500"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {link.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Drawer footer — user info + logout */}
        <div className={`border-t px-3 py-4 space-y-2 ${isMidnightJelly ? "border-white/10" : "border-slate-200"}`}>
          {/* Logout row — Facebook style */}
          <button
            onClick={logout}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
              isMidnightJelly
                ? "text-rose-300 hover:bg-white/8"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isMidnightJelly ? "bg-white/10" : "bg-slate-200"}`}>
              <LogOut className={`h-4 w-4 ${isMidnightJelly ? "text-rose-300" : "text-slate-700"}`} />
            </span>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
