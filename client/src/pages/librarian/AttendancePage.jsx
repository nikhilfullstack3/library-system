import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";

export function AttendancePage() {
  const { libraryData, markPresent } = useAuth();

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div>
          <CardTitle>Attendance</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Check in, check out, and daily attendance records.</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-wrap gap-2">
          {libraryData?.students.map((student) => (
            <Button key={student.id} size="sm" variant="outline" onClick={() => markPresent(student.id)}>
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
            {libraryData?.attendance.map((item) => (
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
      </CardContent>
    </Card>
  );
}
