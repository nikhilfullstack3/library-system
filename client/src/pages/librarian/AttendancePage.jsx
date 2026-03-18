import { QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";

export function AttendancePage() {
  const { fetchAttendance, fetchAttendanceQrToken, fetchStudents, markPresent } = useAuth();
  const [page, setPage] = useState(1);
  const [attendanceResponse, setAttendanceResponse] = useState({ items: [], pagination: null });
  const [students, setStudents] = useState([]);
  const [qrToken, setQrToken] = useState("");

  function loadAttendance(nextPage = page) {
    return fetchAttendance({ page: nextPage, limit: 25 }).then(setAttendanceResponse);
  }

  useEffect(() => {
    loadAttendance(page).catch(() => {});
  }, [fetchAttendance, page]);

  useEffect(() => {
    fetchStudents({ page: 1, limit: 20 }).then((data) => setStudents(data.items || [])).catch(() => {});
  }, [fetchStudents]);

  useEffect(() => {
    fetchAttendanceQrToken().then((data) => setQrToken(data.token || "")).catch(() => {});
  }, [fetchAttendanceQrToken]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <Card className="rounded-3xl">
        <CardHeader>
          <div>
            <CardTitle>Student QR Check-In / Check-Out</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Students scan this QR from the app. The same QR toggles check-in and check-out for today.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center rounded-[2rem] border border-emerald-100 bg-emerald-50/50 px-6 py-6">
            {qrToken ? <QRCodeSVG size={220} value={qrToken} /> : <div className="h-[220px] w-[220px] rounded-3xl bg-slate-100" />}
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <QrCode className="h-4 w-4" />
              Active for today
            </div>
          </div>
          <Button className="w-full rounded-2xl" onClick={async () => setQrToken((await fetchAttendanceQrToken()).token || "")} variant="outline">
            Refresh QR
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div>
            <CardTitle>Attendance</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Check in, check out, and daily attendance records.</p>
          </div>
        </CardHeader>
        <CardContent>
        <div className="mb-6 flex flex-wrap gap-2">
          {students.map((student) => (
            <Button
              key={student.id}
              size="sm"
              variant="outline"
              onClick={async () => {
                await markPresent(student.id);
                setPage(1);
                await loadAttendance(1);
              }}
            >
              Mark Present: {student.name}
            </Button>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceResponse.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-slate-900">{item.student}</TableCell>
                <TableCell>{item.seat}</TableCell>
                <TableCell>{item.checkIn}</TableCell>
                <TableCell>{item.checkOut}</TableCell>
                <TableCell>{item.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {attendanceResponse.pagination?.page || 1} of {attendanceResponse.pagination?.totalPages || 1}
          </span>
          <div className="flex gap-2">
            <Button disabled={!attendanceResponse.pagination?.hasPreviousPage} size="sm" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </Button>
            <Button disabled={!attendanceResponse.pagination?.hasNextPage} size="sm" variant="outline" onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
