import { Activity, Armchair, BookUser, LibraryBig } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../context/AuthContext";

const statsConfig = [
  {
    key: "totalStudents",
    label: "Total Students",
    helper: "Registered learners",
    icon: BookUser,
    panel: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "occupiedSeats",
    label: "Occupied Seats",
    helper: "Currently assigned",
    icon: Armchair,
    panel: "bg-sky-50 text-sky-700",
  },
  {
    key: "emptySeats",
    label: "Open Seats",
    helper: "Available now",
    icon: LibraryBig,
    panel: "bg-amber-50 text-amber-700",
  },
  {
    key: "todaysAttendance",
    label: "Today's Attendance",
    helper: "Marked present today",
    icon: Activity,
    panel: "bg-violet-50 text-violet-700",
  },
];

export function DashboardPage() {
  const { libraryData, session } = useAuth();
  const stats = libraryData?.stats || {};

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-emerald-100 bg-[linear-gradient(135deg,#f8fff9_0%,#eff9f1_100%)]">
        <CardHeader>
          <CardTitle className="text-2xl">
            {session?.role === "admin" ? "Admin Dashboard" : "Librarian Dashboard"}
          </CardTitle>
          <CardDescription>
            Simple overview of students, seats, and today&apos;s attendance.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.key} className="overflow-hidden rounded-3xl">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl">{stats[stat.key] || 0}</CardTitle>
                </div>
                <div className={`rounded-2xl p-3 ${stat.panel}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{stat.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
