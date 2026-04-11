import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function statusVariant(status) {
  if (status === "paid") return "success";
  if (status === "pending") return "warning";
  return "destructive";
}

export function PaymentsPage() {
  const { fetchPayments, markPaymentPaid } = useAuth();
  const { isMidnightJelly } = useTheme();
  const [page, setPage] = useState(1);
  const [paymentResponse, setPaymentResponse] = useState({ items: [], pagination: null });

  function loadPayments(nextPage = page) {
    return fetchPayments({ page: nextPage, limit: 25 }).then(setPaymentResponse);
  }

  useEffect(() => {
    loadPayments(page).catch(() => {});
  }, [fetchPayments, page]);

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Monthly payment records with quick action to mark dues as paid.</p>
      </CardHeader>
      <CardContent>
        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {paymentResponse.items.map((payment) => (
            <div key={payment.id} className={`rounded-2xl border p-4 ${isMidnightJelly ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/50"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>{payment.student}</p>
                <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
              </div>
              <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
                Seat {payment.seat} · {payment.month} · <span className={isMidnightJelly ? "text-violet-100" : "text-slate-700"}>Rs {payment.amount}</span>
              </p>
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={async () => { await markPaymentPaid(payment.id); await loadPayments(page); }}>
                  Mark Paid
                </Button>
              </div>
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
              <TableHead>Month</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentResponse.items.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className={`font-medium ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>{payment.student}</TableCell>
                <TableCell>{payment.seat}</TableCell>
                <TableCell>{payment.month}</TableCell>
                <TableCell>Rs {payment.amount}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await markPaymentPaid(payment.id);
                      await loadPayments(page);
                    }}
                  >
                    Mark Paid
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        <div className={`mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
          <span>
            Page {paymentResponse.pagination?.page || 1} of {paymentResponse.pagination?.totalPages || 1}
          </span>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button className="flex-1 sm:flex-none" disabled={!paymentResponse.pagination?.hasPreviousPage} size="sm" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </Button>
            <Button className="flex-1 sm:flex-none" disabled={!paymentResponse.pagination?.hasNextPage} size="sm" variant="outline" onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
