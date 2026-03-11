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

function paymentVariant(status) {
  if (status === "paid") return "success";
  if (status === "pending") return "warning";
  return "destructive";
}

export function StudentsPage() {
  const { createStudent, deleteStudent, libraryData, updateStudent } = useAuth();

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Students</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Manage student profiles, seats, contact info, and payment status.</p>
        </div>
        <AddStudentDialog onSubmit={createStudent} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Seat Number</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {libraryData?.students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                <TableCell>{student.seatNumber}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>{new Date(student.joinDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={paymentVariant(student.paymentStatus)}>{student.paymentStatus}</Badge>
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
                        paymentStatus: student.paymentStatus,
                        hoursSpent: String(student.hoursSpent || 0),
                      }}
                      onSubmit={(formData) => updateStudent(student.id, formData)}
                      submitLabel="Update Student"
                      title="Edit Student"
                      trigger={
                        <Button size="icon" variant="ghost">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button size="icon" variant="ghost" onClick={() => deleteStudent(student.id)}>
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
                          <p><span className="font-semibold text-slate-900">Login ID:</span> {student.loginId || "Issued after payment is marked paid"}</p>
                          <p><span className="font-semibold text-slate-900">Password:</span> {student.issuedPassword || "Issued after payment is marked paid"}</p>
                          <p><span className="font-semibold text-slate-900">Documents:</span> {student.documents.join(", ") || "None"}</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
