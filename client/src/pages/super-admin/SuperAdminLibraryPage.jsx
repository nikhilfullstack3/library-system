import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { LibraryViewBackLink } from "../../components/layout/SuperAdminShell";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";

export function SuperAdminLibraryPage() {
  const { fetchSuperAdminLibrary } = useAuth();
  const { libraryId } = useParams();
  const [libraryView, setLibraryView] = useState(null);

  useEffect(() => {
    if (!libraryId) {
      return;
    }

    fetchSuperAdminLibrary(libraryId).then(setLibraryView).catch(() => {});
  }, [fetchSuperAdminLibrary, libraryId]);

  const stats = [
    { label: "Total Students", value: libraryView?.stats?.totalStudents || 0 },
    { label: "Revenue", value: `Rs ${libraryView?.stats?.totalRevenue || 0}` },
    { label: "Pending Payments", value: libraryView?.stats?.pendingPayments || 0 },
    { label: "Current Students", value: libraryView?.stats?.currentStudents || 0 },
  ];

  return (
    <div className="space-y-6">
      <LibraryViewBackLink>Back to platform dashboard</LibraryViewBackLink>

      <section className="rounded-[2rem] border border-emerald-100 bg-white/88 p-6 shadow-[0_20px_60px_-45px_rgba(22,101,52,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Library Detail</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{libraryView?.library?.name || "Loading library..."}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {libraryView?.library?.location || "Unspecified"} · {libraryView?.library?.contactEmail || "-"}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="rounded-[2rem] border-emerald-100 bg-white/88">
            <CardHeader className="pb-2">
              <p className="text-sm text-slate-500">{item.label}</p>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-slate-900">{item.value}</CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem] border-emerald-100 bg-white/88">
          <CardHeader>
            <CardTitle>Recent students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(libraryView?.students || []).map((student) => (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3" key={student.id}>
                <div>
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-500">{student.phone} · {student.shiftTiming || student.shift || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-700">{student.paymentStatus}</p>
                  <p className="text-xs text-slate-500">Seat {student.seatNumber || "-"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-emerald-100 bg-white/88">
            <CardHeader>
              <CardTitle>Librarians</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(libraryView?.librarians || []).map((librarian) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" key={librarian.id}>
                  <p className="font-semibold text-slate-900">{librarian.name}</p>
                  <p className="text-sm text-slate-500">{librarian.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-700">{librarian.role}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-emerald-100 bg-white/88">
            <CardHeader>
              <CardTitle>Payments snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(libraryView?.payments || []).map((payment) => (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" key={payment.id}>
                  <div>
                    <p className="font-semibold text-slate-900">{payment.student}</p>
                    <p className="text-sm text-slate-500">{payment.month}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">Rs {payment.amount}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">{payment.status}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
