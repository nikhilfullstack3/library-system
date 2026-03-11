import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../context/AuthContext";

export function SeatsPage() {
  const { libraryData } = useAuth();

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Seats</CardTitle>
        <p className="mt-1 text-sm text-slate-500">Visual seat map with occupied and empty study room capacity.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {libraryData?.seats.map((seat) => {
            const occupied = seat.status === "occupied";

            return (
              <div
                key={seat.id}
                className={`rounded-3xl border p-5 transition-transform hover:-translate-y-1 ${
                  occupied ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">{seat.label}</h2>
                  <Badge variant={occupied ? "destructive" : "success"}>{occupied ? "Occupied" : "Empty"}</Badge>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  {occupied ? seat.student?.name : "Available for assignment"}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
