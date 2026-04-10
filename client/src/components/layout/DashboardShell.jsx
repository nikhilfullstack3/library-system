import { FileText, LayoutDashboard, MessageCircleMore, Rows3, Search, SquareLibrary, UserPlus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
    <div className="min-h-screen text-slate-900">
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Modern slim header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur-2xl">
            <div className="flex items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
              {/* Brand/title */}
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  <span className="text-gradient">{libraryData?.library?.name || "Studyly Library"}</span>
                </h1>
              </div>

              {/* Search */}
              <div className="hidden flex-1 max-w-md sm:block">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm transition-all focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search students by name or number…"
                  />
                  {searchTerm && (
                    <kbd className="hidden rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 sm:inline">
                      ⌘K
                    </kbd>
                  )}
                </div>
              </div>

            </div>

            {/* Mobile search */}
            <div className="px-4 pb-3 sm:hidden">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm focus-within:border-emerald-400">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search students…"
                />
              </div>
            </div>

            {/* Mobile nav */}
            <div className="border-t border-slate-200/60 px-4 py-2.5 md:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {mobileLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <NavLink
                      key={link.to}
                      className={({ isActive }) =>
                        `flex min-w-fit items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition ${
                          isActive
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
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
