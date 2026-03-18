import { Building2, IndianRupee, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../context/AuthContext";

const statIcons = [Building2, Users, IndianRupee];

export function SuperAdminDashboardPage() {
  const { refreshSuperAdminData, superAdminData } = useAuth();
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    refreshSuperAdminData().catch(() => {});
  }, [refreshSuperAdminData]);

  const summary = [
    { label: "Libraries", value: superAdminData?.summary?.totalLibraries || 0, hint: "Active library accounts" },
    { label: "Students", value: superAdminData?.summary?.totalStudents || 0, hint: "Learners across all libraries" },
    { label: "Revenue", value: `Rs ${superAdminData?.summary?.totalRevenue || 0}`, hint: "Paid collections" },
  ];

  const filteredLibraries = useMemo(() => {
    const value = locationFilter.trim().toLowerCase();
    if (!value) {
      return superAdminData?.libraries || [];
    }

    return (superAdminData?.libraries || []).filter((library) =>
      [library.location, library.name, library.contactEmail].some((item) => String(item || "").toLowerCase().includes(value))
    );
  }, [locationFilter, superAdminData?.libraries]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.map((item, index) => {
          const Icon = statIcons[index];
          return (
            <Card key={item.label} className="rounded-[2rem] border-emerald-100 bg-white/88 shadow-[0_20px_55px_-45px_rgba(22,101,52,0.28)]">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <CardTitle className="mt-3 text-3xl">{item.value}</CardTitle>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-slate-500">{item.hint}</CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6">
        <Card className="rounded-[2rem] border-emerald-100 bg-white/88">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Libraries by location</CardTitle>
              <p className="mt-1 text-sm text-slate-500">A simple all-libraries list grouped by location with revenue visibility. Open a library if you need its internal admin view.</p>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Filter by location or library"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(superAdminData?.locations || []).map((locationGroup) => {
              const locationLibraries = filteredLibraries.filter(
                (library) => (library.location || "Unspecified") === locationGroup.location
              );

              if (!locationLibraries.length) {
                return null;
              }

              return (
                <div className="space-y-3 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/30 p-4" key={locationGroup.location}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{locationGroup.location}</p>
                      <p className="text-sm text-slate-500">{locationLibraries.length} libraries</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-700">Rs {locationGroup.revenue}</p>
                  </div>

                  {locationLibraries.map((library) => (
                    <Link
                      className="block rounded-[1.5rem] border border-emerald-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-35px_rgba(22,101,52,0.4)]"
                      key={library.id}
                      to={`/super-admin/libraries/${library.id}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{library.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{library.contactEmail}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <StatPill label="Students" value={library.totalStudents} />
                          <StatPill label="Revenue" value={`Rs ${library.totalRevenue}`} />
                          <StatPill label="Librarians" value={library.totalLibrarians} />
                          <StatPill label="Paid" value={library.paidPaymentsCount} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
            {!filteredLibraries.length ? <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">No libraries match that location filter.</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 text-center">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
