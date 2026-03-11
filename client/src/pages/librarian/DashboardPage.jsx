import { Activity, Armchair, BookUser, LibraryBig } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../context/AuthContext";

const icons = [BookUser, Armchair, LibraryBig, Activity];

export function DashboardPage() {
  const { libraryData } = useAuth();
  const dashboardStats = [
    {
      label: "Total Students",
      value: String(libraryData?.stats.totalStudents || 0),
      change: "Registered learners",
    },
    {
      label: "Occupied Seats",
      value: String(libraryData?.stats.occupiedSeats || 0),
      change: "Currently assigned",
    },
    {
      label: "Empty Seats",
      value: String(libraryData?.stats.emptySeats || 0),
      change: "Available now",
    },
    {
      label: "Today's Attendance",
      value: String(libraryData?.stats.todaysAttendance || 0),
      change: "Marked present today",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => {
          const Icon = icons[index];

          return (
            <Card key={stat.label} className="overflow-hidden rounded-3xl">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl">{stat.value}</CardTitle>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Daily study room usage</CardTitle>
            <CardDescription>Overview of active usage and demand across the floor.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <InsightCard color="bg-sky-500" title="Peak Time" value="09:00 AM - 12:00 PM" />
              <InsightCard color="bg-emerald-500" title="Average Session" value="5.8 hours" />
              <InsightCard color="bg-violet-500" title="Renewal Rate" value="92%" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Admin focus</CardTitle>
            <CardDescription>Quick summary of operational tasks that need attention today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TaskRow
              label="Pending payments"
              value={`${libraryData?.payments.filter((item) => item.status !== "paid").length || 0} students`}
            />
            <TaskRow
              label="Document reviews"
              value={`${libraryData?.documents.filter((item) => item.status !== "verified").length || 0} awaiting check`}
            />
            <TaskRow
              label="Attendance records"
              value={`${libraryData?.attendance.length || 0} logged`}
            />
            <TaskRow label="Available seats" value={`${libraryData?.stats.emptySeats || 0} open now`} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function InsightCard({ color, title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className={`h-2 w-16 rounded-full ${color}`} />
      <p className="mt-4 text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TaskRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
