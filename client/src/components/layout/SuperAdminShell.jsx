import { Building2, ChevronRight, Globe2, LogOut, MapPinned, UserPlus } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  {
    label: "Libraries",
    to: "/super-admin",
    icon: Building2,
  },
  {
    label: "Registration",
    to: "/super-admin/registration",
    icon: UserPlus,
  },
];

export function SuperAdminShell() {
  const { logout, session, superAdminData } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_18%),linear-gradient(180deg,#f8fffa_0%,#eef9f1_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-emerald-100 bg-white/85 p-4 shadow-[0_24px_80px_-48px_rgba(22,101,52,0.35)] backdrop-blur-xl lg:flex lg:flex-col">
          <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Globe2 className="h-6 w-6" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-600">Super Admin</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Platform control</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Manage every study room library, compare locations, and review revenue centrally.</p>
          </div>

          <nav className="mt-6 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-slate-900"
                    }`
                  }
                  end={link.to === "/super-admin"}
                  to={link.to}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Live scope</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Libraries</span>
                <span className="font-semibold">{superAdminData?.summary?.totalLibraries || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Students</span>
                <span className="font-semibold">{superAdminData?.summary?.totalStudents || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Revenue</span>
                <span className="font-semibold">Rs {superAdminData?.summary?.totalRevenue || 0}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="rounded-[2rem] border border-emerald-100 bg-white/82 px-5 py-5 shadow-[0_20px_60px_-44px_rgba(22,101,52,0.28)] backdrop-blur-xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  <MapPinned className="h-3.5 w-3.5" />
                  All Libraries View
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Welcome, {session?.name || "Super Admin"}</h2>
                <p className="mt-1 text-sm text-slate-600">Register new libraries here and keep the rest of the view focused on libraries by location.</p>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                onClick={logout}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </header>

          <div className="mt-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LibraryViewBackLink({ children }) {
  return (
    <NavLink
      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
      to="/super-admin"
    >
      <ChevronRight className="h-4 w-4 rotate-180" />
      {children}
    </NavLink>
  );
}
