import { useEffect, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AddStudentDialog } from "../../components/students/AddStudentDialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const SHIFT_END_WARNING_MS = 30 * 60 * 1000;

function documentVariant(status) {
  if (status === "verified") return "success";
  if (status === "not verified") return "warning";
  return "secondary";
}

function documentLabel(status) {
  if (status === "verified") return "Verified";
  if (status === "not verified") return "Not Verified";
  return "Not Uploaded";
}

function getShiftEndDate(student) {
  if (!student.shiftEndTime || student.fullDay) {
    return null;
  }

  const normalized = String(student.shiftEndTime).trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM") {
    hours += 12;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}


function getShiftWarning(student) {
  if (!student.currentlyInLibrary) {
    return null;
  }

  const shiftEndDate = getShiftEndDate(student);
  if (!shiftEndDate) {
    return null;
  }

  const remainingMs = shiftEndDate.getTime() - Date.now();
  if (remainingMs <= 0) {
    return {
      isWarning: true,
      text: "Shift ended",
    };
  }

  if (remainingMs > SHIFT_END_WARNING_MS) {
    return null;
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    isWarning: true,
    text: `Shift ends in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`,
  };
}

export function StudentsPage() {
  const { deleteStudent, fetchStudents, updateStudent, updateStudentDocumentVerification } = useAuth();
  const { isMidnightJelly } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [studentResponse, setStudentResponse] = useState({ items: [], pagination: null });
  const [updatingVerificationId, setUpdatingVerificationId] = useState("");
  const searchQuery = searchParams.get("search")?.trim() || "";

  function loadStudents(nextPage = page, search = searchQuery) {
    return fetchStudents({ page: nextPage, limit: 25, search }).then(setStudentResponse);
  }

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    loadStudents(page, searchQuery).catch(() => {});
  }, [fetchStudents, page, searchQuery]);

  const students = studentResponse.items || [];
  const pagination = studentResponse.pagination;
  const endingSoonStudents = students.filter((student) => getShiftWarning(student));

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Students</CardTitle>
          <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Manage student profiles, seats, contact info, and document verification.</p>
        </div>
      </CardHeader>
      <CardContent>
        {searchQuery ? (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${isMidnightJelly ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100" : "border-sky-200 bg-sky-50 text-sky-700"}`}>
            Showing results for <span className="font-semibold">"{searchQuery}"</span>. Search matches student name, email, phone, or seat number.
          </div>
        ) : null}
        {endingSoonStudents.length ? (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${isMidnightJelly ? "border-rose-300/20 bg-rose-400/10 text-rose-100" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {endingSoonStudents.length === 1
              ? `${endingSoonStudents[0].name}'s shift is about to end.`
              : `${endingSoonStudents.length} students have shifts ending within 30 minutes.`}
          </div>
        ) : null}
        {/* Mobile card list — shown on small screens */}
        <div className="sm:hidden space-y-3">
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">{searchQuery ? "No students found for this search." : "No students available yet."}</p>
          ) : null}
          {students.map((student) => {
            const shiftWarning = getShiftWarning(student);
            return (
              <div key={student.id} className={`rounded-2xl border p-4 ${shiftWarning ? (isMidnightJelly ? "border-rose-300/30 bg-rose-400/12" : "border-rose-200 bg-rose-50/60") : (isMidnightJelly ? "border-white/20 bg-white/8" : "border-slate-200 bg-slate-50/50")}`}>
                <div className="flex items-start justify-between gap-2">
                  <button
                    className={`text-base font-semibold underline-offset-4 hover:underline text-left ${isMidnightJelly ? "text-cyan-200" : "text-sky-700"}`}
                    onClick={() => navigate(`/librarian/students/${student.id}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`)}
                    type="button"
                  >
                    {student.name}
                  </button>
                  <Badge variant={documentVariant(student.documentVerificationStatus)}>{documentLabel(student.documentVerificationStatus)}</Badge>
                </div>
                <div className={`mt-2 space-y-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
                  <p>Seat <span className={isMidnightJelly ? "text-violet-100" : "text-slate-700"}>{student.seatNumber}</span> · {student.phone}</p>
                  <p className={shiftWarning ? (isMidnightJelly ? "font-semibold text-rose-200" : "font-semibold text-rose-600") : ""}>
                    {student.shiftTiming || student.shift || "-"}
                  </p>
                  {shiftWarning ? <p className={`text-xs ${isMidnightJelly ? "text-rose-200" : "text-rose-500"}`}>{shiftWarning.text}</p> : null}
                </div>
                <div className="mt-3 flex gap-2">
                  <AddStudentDialog
                    initialValues={{ name: student.name, email: student.email, phone: student.phone, address: student.address, seatNumber: student.seatNumber, shift: student.shift, shiftTiming: student.shiftTiming, paymentStatus: student.paymentStatus, hoursSpent: String(student.hoursSpent || 0) }}
                    onSubmit={async (formData) => { await updateStudent(student.id, formData); await loadStudents(page, searchQuery); }}
                    submitLabel="Update Student" title="Edit Student"
                    trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>}
                  />
                  <Button size="icon" variant="ghost" onClick={async () => { await deleteStudent(student.id); await loadStudents(page, searchQuery); }}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost"><Eye className="h-4 w-4 text-sky-600" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{student.name}</DialogTitle><DialogDescription>Student profile and seat assignment details.</DialogDescription></DialogHeader>
                      <div className={`grid gap-3 rounded-2xl p-4 text-sm ${isMidnightJelly ? "bg-white/5 text-violet-100/85" : "bg-slate-50 text-slate-700"}`}>
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Seat:</span> {student.seatNumber}</p>
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Phone:</span> {student.phone}</p>
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Address:</span> {student.address}</p>
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Shift:</span> {student.shift}</p>
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Shift Timing:</span> {student.shiftTiming || "-"}</p>
                        {shiftWarning ? <p className={isMidnightJelly ? "text-rose-200" : "text-rose-600"}><span className={`font-semibold ${isMidnightJelly ? "text-rose-100" : "text-rose-700"}`}>Alert:</span> {shiftWarning.text}</p> : null}
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Login ID:</span> {student.loginId || "-"}</p>
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Password:</span> {student.issuedPassword || "Issued after payment is marked paid"}</p>
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Document Verification:</span> {documentLabel(student.documentVerificationStatus)}</p>
                        <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Documents:</span> {student.documents.join(", ") || "None"}</p>
                        <div className="pt-2">
                          <Button disabled={updatingVerificationId === student.id || !student.documents.length} onClick={async () => { setUpdatingVerificationId(student.id); try { await updateStudentDocumentVerification(student.id, student.documentVerificationStatus !== "verified"); await loadStudents(page, searchQuery); } finally { setUpdatingVerificationId(""); } }} type="button" variant={student.documentVerificationStatus === "verified" ? "outline" : "default"}>
                            {updatingVerificationId === student.id ? "Updating..." : student.documentVerificationStatus === "verified" ? "Mark As Not Verified" : "Mark As Verified"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table — hidden on small screens */}
        <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Seat Number</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Document Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell className="py-8 text-center text-slate-500" colSpan={6}>
                  {searchQuery ? "No students found for this search." : "No students available yet."}
                </TableCell>
              </TableRow>
            ) : null}
            {students.map((student) => {
              const shiftWarning = getShiftWarning(student);

              return (
              <TableRow className={shiftWarning ? (isMidnightJelly ? "bg-rose-400/8" : "bg-rose-50/60") : ""} key={student.id}>
                <TableCell className={`font-medium ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
                  <button
                    className={`cursor-pointer underline-offset-4 hover:underline ${isMidnightJelly ? "text-cyan-200 hover:text-cyan-100" : "text-sky-700 hover:text-sky-800"}`}
                    onClick={() =>
                      navigate(
                        `/librarian/students/${student.id}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`
                      )
                    }
                    type="button"
                  >
                    {student.name}
                  </button>
                </TableCell>
                <TableCell className={isMidnightJelly ? "text-violet-100" : "text-slate-700"}>{student.seatNumber}</TableCell>
                <TableCell className={isMidnightJelly ? "text-violet-100" : "text-slate-700"}>{student.phone}</TableCell>
                <TableCell>
                  <div className={shiftWarning ? (isMidnightJelly ? "font-semibold text-rose-200" : "font-semibold text-rose-600") : isMidnightJelly ? "text-violet-100/85" : "text-slate-700"}>
                    {student.shiftTiming || student.shift || "-"}
                  </div>
                  {shiftWarning ? <div className={`text-xs ${isMidnightJelly ? "text-rose-200/80" : "text-rose-500"}`}>{shiftWarning.text}</div> : null}
                </TableCell>
                <TableCell>
                  <Badge variant={documentVariant(student.documentVerificationStatus)}>
                    {documentLabel(student.documentVerificationStatus)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <AddStudentDialog
                      initialValues={{
                        name: student.name,
                        email: student.email,
                        phone: student.phone,
                        address: student.address,
                        seatNumber: student.seatNumber,
                        shift: student.shift,
                        shiftTiming: student.shiftTiming,
                        paymentStatus: student.paymentStatus,
                        hoursSpent: String(student.hoursSpent || 0),
                      }}
                      onSubmit={async (formData) => {
                        await updateStudent(student.id, formData);
                        await loadStudents(page, searchQuery);
                      }}
                      submitLabel="Update Student"
                      title="Edit Student"
                      trigger={
                        <Button size="icon" variant="ghost">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        await deleteStudent(student.id);
                        await loadStudents(page, searchQuery);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Eye className="h-4 w-4 text-sky-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{student.name}</DialogTitle>
                          <DialogDescription>Student profile and seat assignment details.</DialogDescription>
                        </DialogHeader>
                        <div className={`grid gap-3 rounded-2xl p-4 text-sm ${isMidnightJelly ? "bg-white/5 text-violet-100/85" : "bg-slate-50 text-slate-700"}`}>
                          <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Seat:</span> {student.seatNumber}</p>
                          <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Phone:</span> {student.phone}</p>
                          <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Address:</span> {student.address}</p>
                          <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Shift:</span> {student.shift}</p>
                          <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Shift Timing:</span> {student.shiftTiming || "-"}</p>
                          {shiftWarning ? <p className={isMidnightJelly ? "text-rose-200" : "text-rose-600"}><span className={`font-semibold ${isMidnightJelly ? "text-rose-100" : "text-rose-700"}`}>Alert:</span> {shiftWarning.text}</p> : null}
                          <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Login ID:</span> {student.loginId || "-"}</p>
                          <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Password:</span> {student.issuedPassword || "Issued after payment is marked paid"}</p>
                          <p>
                            <span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Document Verification:</span>{" "}
                            {documentLabel(student.documentVerificationStatus)}
                          </p>
                          <p><span className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Documents:</span> {student.documents.join(", ") || "None"}</p>
                          <div className="pt-2">
                            <Button
                              disabled={updatingVerificationId === student.id || !student.documents.length}
                              onClick={async () => {
                                setUpdatingVerificationId(student.id);
                                try {
                                  await updateStudentDocumentVerification(
                                    student.id,
                                    student.documentVerificationStatus !== "verified"
                                  );
                                  await loadStudents(page, searchQuery);
                                } finally {
                                  setUpdatingVerificationId("");
                                }
                              }}
                              type="button"
                              variant={student.documentVerificationStatus === "verified" ? "outline" : "default"}
                            >
                              {updatingVerificationId === student.id
                                ? "Updating..."
                                : student.documentVerificationStatus === "verified"
                                  ? "Mark As Not Verified"
                                  : "Mark As Verified"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
        </div>
        <div className={`mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
          <span>
            Page {pagination?.page || 1} of {pagination?.totalPages || 1}
          </span>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button className="flex-1 sm:flex-none" disabled={!pagination?.hasPreviousPage} size="sm" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </Button>
            <Button className="flex-1 sm:flex-none" disabled={!pagination?.hasNextPage} size="sm" variant="outline" onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
