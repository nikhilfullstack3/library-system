import { ChevronRight, QrCode } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { pageCache } from "../../lib/pageCache";

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendancePage() {
  const { fetchAttendance, fetchAttendanceQrToken, fetchStudents, markPresent } = useAuth();
  const { isMidnightJelly } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [attendanceResponse, setAttendanceResponse] = useState(
    () => pageCache.get("attendance-1") || { items: [], pagination: null }
  );
  const [todayAttendance, setTodayAttendance] = useState(
    () => pageCache.get("attendance-today") || []
  );
  const [students, setStudents] = useState(
    () => pageCache.get("attendance-students") || []
  );
  const [qrToken, setQrToken] = useState("");
  const todayDateKey = getTodayDateKey();

  const loadAttendance = useCallback((nextPage = page) => {
    return fetchAttendance({ page: nextPage, limit: 25 }).then((data) => {
      pageCache.set(`attendance-${nextPage}`, data);
      setAttendanceResponse(data);
    });
  }, [fetchAttendance, page]);

  const loadTodayAttendance = useCallback(() => {
    return fetchAttendance({ page: 1, limit: 100, dateKey: todayDateKey }).then((data) => {
      const items = data.items || [];
      pageCache.set("attendance-today", items);
      setTodayAttendance(items);
    });
  }, [fetchAttendance, todayDateKey]);

  // Fetch attendance list + today's present students together
  useEffect(() => {
    loadAttendance(page).catch(() => {});
    loadTodayAttendance().catch(() => {});
  }, [page, loadAttendance, loadTodayAttendance]);

  // Fetch students list + QR token once on mount (stable deps, won't re-fire)
  useEffect(() => {
    fetchStudents({ page: 1, limit: 20 }).then((data) => {
      const items = data.items || [];
      pageCache.set("attendance-students", items);
      setStudents(items);
    }).catch(() => {});
    fetchAttendanceQrToken().then((data) => setQrToken(data.token || "")).catch(() => {});
  }, [fetchStudents, fetchAttendanceQrToken]);

  const presentStudents = todayAttendance.filter((item) => item.isActive && item.studentId);

  function openStudent(studentId) {
    if (!studentId) {
      return;
    }

    navigate(
      `/librarian/students/${studentId}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}&focus=attendance#attendance-history`
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
      <Card className="rounded-3xl">
        <CardHeader>
          <div>
            <CardTitle>Student QR Check-In / Check-Out</CardTitle>
            <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Students scan this QR from the app. The same QR toggles check-in and check-out for today.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex flex-col items-center rounded-[2rem] border px-6 py-6 ${isMidnightJelly ? "border-cyan-300/20 bg-cyan-400/8" : "border-emerald-100 bg-emerald-50/50"}`}>
            {qrToken ? <QRCodeSVG size={220} value={qrToken} /> : <div className="h-[220px] w-[220px] rounded-3xl bg-slate-100" />}
            <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${isMidnightJelly ? "text-cyan-100" : "text-emerald-700"}`}>
              <QrCode className="h-4 w-4" />
              Active for today
            </div>
          </div>
          <Button className="w-full rounded-2xl" onClick={async () => setQrToken((await fetchAttendanceQrToken()).token || "")} variant="outline">
            Refresh QR
          </Button>

          <div className={`rounded-[2rem] border p-4 ${isMidnightJelly ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Students Present in Library</h3>
                <p className={`mt-1 text-xs ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Click any student to open attendance history.</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isMidnightJelly ? "bg-cyan-400/12 text-cyan-100" : "bg-emerald-100 text-emerald-700"}`}>
                {presentStudents.length}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {presentStudents.length > 0 ? (
                presentStudents.map((student) => (
                  <button
                    key={student.id}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${isMidnightJelly ? "border-white/10 bg-white/5 hover:border-cyan-300/30 hover:bg-cyan-400/10" : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50"}`}
                    onClick={() => openStudent(student.studentId)}
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>{student.student}</p>
                      <p className={`mt-1 text-xs ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
                        Seat {student.seat || "-"} • Checked in at {student.checkIn || "-"}
                      </p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 ${isMidnightJelly ? "text-violet-100/55" : "text-slate-400"}`} />
                  </button>
                ))
              ) : (
                <div className={`rounded-2xl border border-dashed px-4 py-6 text-center text-sm ${isMidnightJelly ? "border-white/10 bg-white/5 text-violet-100/70" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  No students are currently marked present.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div>
            <CardTitle>Attendance</CardTitle>
            <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Check in, check out, and daily attendance records.</p>
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
                await loadTodayAttendance();
              }}
            >
              Mark Present: {student.name}
            </Button>
          ))}
        </div>
        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {attendanceResponse.items.map((item) => (
            <div key={item.id} className={`rounded-2xl border p-4 ${isMidnightJelly ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/50"}`}>
              <div className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
                {item.studentId ? (
                  <button className={`underline-offset-4 hover:underline text-left ${isMidnightJelly ? "text-cyan-200" : "text-sky-700"}`} onClick={() => openStudent(item.studentId)} type="button">
                    {item.student}
                  </button>
                ) : item.student}
              </div>
              <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
                Seat {item.seat} · {item.date}
              </p>
              <p className={`text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
                In: <span className={isMidnightJelly ? "text-violet-100" : "text-slate-700"}>{item.checkIn || "-"}</span> · Out: <span className={isMidnightJelly ? "text-violet-100" : "text-slate-700"}>{item.checkOut || "-"}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
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
                <TableCell className={`font-medium ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
                  {item.studentId ? (
                    <button
                      className={`cursor-pointer underline-offset-4 hover:underline ${isMidnightJelly ? "text-cyan-200 hover:text-cyan-100" : "text-sky-700 hover:text-sky-800"}`}
                      onClick={() => openStudent(item.studentId)}
                      type="button"
                    >
                      {item.student}
                    </button>
                  ) : (
                    item.student
                  )}
                </TableCell>
                <TableCell>{item.seat}</TableCell>
                <TableCell>{item.checkIn}</TableCell>
                <TableCell>{item.checkOut}</TableCell>
                <TableCell>{item.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        <div className={`mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
          <span>
            Page {attendanceResponse.pagination?.page || 1} of {attendanceResponse.pagination?.totalPages || 1}
          </span>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button className="flex-1 sm:flex-none" disabled={!attendanceResponse.pagination?.hasPreviousPage} size="sm" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </Button>
            <Button className="flex-1 sm:flex-none" disabled={!attendanceResponse.pagination?.hasNextPage} size="sm" variant="outline" onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
