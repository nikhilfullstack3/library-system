import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";

function statusVariant(status) {
  if (status === "paid") return "success";
  if (status === "pending") return "warning";
  return "destructive";
}

export function PaymentsPage() {
  const { libraryData, markPaymentPaid } = useAuth();

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <p className="mt-1 text-sm text-slate-500">Monthly payment records with quick action to mark dues as paid.</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {libraryData?.payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium text-slate-900">{payment.student}</TableCell>
                <TableCell>{payment.seat}</TableCell>
                <TableCell>{payment.month}</TableCell>
                <TableCell>Rs {payment.amount}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => markPaymentPaid(payment.id)}>
                    Mark Paid
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
