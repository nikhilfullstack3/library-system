import { FileText, LayoutDashboard, MessageCircleMore, MoonStar, Rows3, Search, SquareLibrary, UserPlus, Users } from "lucide-react";
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
  { label: "Chat", to: "/librarian/chat", icon: MessageCircleMore },
];

export function DashboardShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { libraryData } = useAuth();
  const { isMidnightJelly, toggleMidnightJelly } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const searchOriginRef = useRef("");

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
    <div className={`min-h-screen ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
        </div>

        <div className="min-w-0 flex-1">
          <header
            className={`sticky top-0 z-20 border-b backdrop-blur-2xl ${
              isMidnightJelly
                ? "border-white/10 bg-[#120f23]/70"
                : "border-slate-200/60 bg-white/70"
            }`}
          >
            <div className="flex items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="min-w-0 flex-1">
                <h1
                  className={`truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl ${
                    isMidnightJelly ? "text-violet-50" : "text-slate-900"
                  }`}
                >
                  <span>{libraryData?.library?.name || "Studyly Library"}</span>
                </h1>
              </div>

              <div className="hidden flex-1 max-w-md sm:block">
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

            <div className="px-4 pb-3 sm:hidden">
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

            <div className={`px-4 py-2.5 md:hidden ${isMidnightJelly ? "border-t border-white/10" : "border-t border-slate-200/60"}`}>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {mobileLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <NavLink
                      key={link.to}
                      className={({ isActive }) =>
                        `flex min-w-fit items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition ${
                          isActive
                            ? isMidnightJelly
                              ? "bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-md shadow-violet-500/25"
                              : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                            : isMidnightJelly
                              ? "border border-white/10 bg-white/10 text-violet-100"
                              : "border border-slate-200 bg-white/80 text-slate-600"
                        }`
                      }
                      end={link.to === "/librarian"}
                      to={link.to}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
