import { Bell, ChevronDown, FileText, LayoutDashboard, MessageCircleMore, Rows3, Search, SquareLibrary, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { Button } from "../ui/button";

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
  const { libraryData, logout, session } = useAuth();

  return (
    <div className="min-h-screen bg-[#f3fbf5] text-slate-900">
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
        </div>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-[#f3fbf5]/92 backdrop-blur-xl">
            <div className="px-4 py-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top,#f7fff8_0%,#edf9f0_42%,#e3f3e7_100%)] px-5 py-6 shadow-[0_18px_60px_rgba(22,101,52,0.08)] sm:px-6">
                <div className="absolute -left-8 top-0 h-28 w-28 rounded-full bg-emerald-200/35 blur-2xl" />
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-lime-100/70 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 h-20 w-40 -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div className="flex-1 text-center">
                    <div className="mx-auto inline-flex items-center rounded-full border border-emerald-200/80 bg-white/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700 shadow-sm">
                      Library Study Room Management System
                    </div>
                    <h1 className="mt-4 bg-[linear-gradient(135deg,#0f5132_0%,#2d7a4f_50%,#5c9c67_100%)] bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl">
                      {libraryData?.library?.name || "Your Library"}
                    </h1>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
                      Welcome, {session?.name}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto lg:self-center">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/90 bg-white/80 px-3 py-2 text-slate-500 shadow-sm backdrop-blur">
                  <Search className="h-4 w-4" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-56"
                    placeholder="Search students, seats..."
                  />
                </div>

                    <div className="flex items-center gap-2">
                      <Button className="border-white/90 bg-white/80 shadow-sm backdrop-blur" size="icon" variant="outline">
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button className="gap-2 border-white/90 bg-white/80 shadow-sm backdrop-blur" onClick={logout} variant="outline">
                        Logout
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-3 md:hidden">
              <div className="flex gap-2 overflow-x-auto">
                {mobileLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <NavLink
                      key={link.to}
                      className={({ isActive }) =>
                        `flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                          isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-emerald-100 bg-white text-slate-600"
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
