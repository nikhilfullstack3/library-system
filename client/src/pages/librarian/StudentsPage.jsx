import { useEffect, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
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

function getLiveTimer(student) {
  if (!student.currentlyInLibrary || !student.activeSessionStartedAt) {
    return null;
  }

  const elapsedMs = Math.max(0, Date.now() - new Date(student.activeSessionStartedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
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
  const [page, setPage] = useState(1);
  const [studentResponse, setStudentResponse] = useState({ items: [], pagination: null });
  const [updatingVerificationId, setUpdatingVerificationId] = useState("");
  const [, setTimerTick] = useState(0);

  function loadStudents(nextPage = page) {
    return fetchStudents({ page: nextPage, limit: 25 }).then(setStudentResponse);
  }

  useEffect(() => {
    loadStudents(page).catch(() => {});
  }, [fetchStudents, page]);

  useEffect(() => {
    const interval = window.setInterval(() => setTimerTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const students = studentResponse.items || [];
  const pagination = studentResponse.pagination;
  const endingSoonStudents = students.filter((student) => getShiftWarning(student));

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Students</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Manage student profiles, seats, contact info, and document verification.</p>
        </div>
      </CardHeader>
      <CardContent>
        {endingSoonStudents.length ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {endingSoonStudents.length === 1
              ? `${endingSoonStudents[0].name}'s shift is about to end.`
              : `${endingSoonStudents.length} students have shifts ending within 30 minutes.`}
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Seat Number</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Timer / Shift</TableHead>
              <TableHead>Document Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const liveTimer = getLiveTimer(student);
              const shiftWarning = getShiftWarning(student);

              return (
              <TableRow className={shiftWarning ? "bg-rose-50/60" : ""} key={student.id}>
                <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                <TableCell>{student.seatNumber}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>
                  <div className={shiftWarning ? "font-semibold text-rose-600" : "text-slate-700"}>
                    {liveTimer || student.shiftTiming || student.shift || "-"}
                  </div>
                  {shiftWarning ? <div className="text-xs text-rose-500">{shiftWarning.text}</div> : null}
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
                        await loadStudents(page);
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
                        await loadStudents(page);
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
                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                          <p><span className="font-semibold text-slate-900">Seat:</span> {student.seatNumber}</p>
                          <p><span className="font-semibold text-slate-900">Phone:</span> {student.phone}</p>
                          <p><span className="font-semibold text-slate-900">Address:</span> {student.address}</p>
                          <p><span className="font-semibold text-slate-900">Shift:</span> {student.shift}</p>
                          <p><span className="font-semibold text-slate-900">Shift Timing:</span> {student.shiftTiming || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Live Timer:</span> {liveTimer || student.shiftTiming || "-"}</p>
                          {shiftWarning ? <p className="text-rose-600"><span className="font-semibold text-rose-700">Alert:</span> {shiftWarning.text}</p> : null}
                          <p><span className="font-semibold text-slate-900">Login ID:</span> {student.loginId || "Issued after payment is marked paid"}</p>
                          <p><span className="font-semibold text-slate-900">Password:</span> {student.issuedPassword || "Issued after payment is marked paid"}</p>
                          <p>
                            <span className="font-semibold text-slate-900">Document Verification:</span>{" "}
                            {documentLabel(student.documentVerificationStatus)}
                          </p>
                          <p><span className="font-semibold text-slate-900">Documents:</span> {student.documents.join(", ") || "None"}</p>
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
                                  await loadStudents(page);
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
        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
