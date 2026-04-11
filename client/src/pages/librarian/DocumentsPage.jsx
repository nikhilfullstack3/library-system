import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export function DocumentsPage() {
  const { fetchDocuments } = useAuth();
  const { isMidnightJelly } = useTheme();
  const [page, setPage] = useState(1);
  const [documentResponse, setDocumentResponse] = useState({ items: [], pagination: null });

  useEffect(() => {
    fetchDocuments({ page, limit: 25 }).then(setDocumentResponse).catch(() => {});
  }, [fetchDocuments, page]);

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Review uploaded student documents and verification status.</p>
      </CardHeader>
      <CardContent>
        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {documentResponse.items.map((document) => (
            <div key={document.id} className={`rounded-2xl border p-4 ${isMidnightJelly ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/50"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>{document.student}</p>
                <Badge variant={document.status === "verified" ? "success" : "warning"}>{document.status}</Badge>
              </div>
              <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
                Seat {document.seat} · {document.document}
              </p>
              <p className={`mt-0.5 text-xs ${isMidnightJelly ? "text-violet-100/50" : "text-slate-400"}`}>
                {new Date(document.uploadedAt).toLocaleDateString()}
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
              <TableHead>Document</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentResponse.items.map((document) => (
              <TableRow key={document.id}>
                <TableCell className={`font-medium ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>{document.student}</TableCell>
                <TableCell>{document.seat}</TableCell>
                <TableCell>{document.document}</TableCell>
                <TableCell>{new Date(document.uploadedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={document.status === "verified" ? "success" : "warning"}>{document.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        <div className={`mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
          <span>
            Page {documentResponse.pagination?.page || 1} of {documentResponse.pagination?.totalPages || 1}
          </span>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button className="flex-1 sm:flex-none" disabled={!documentResponse.pagination?.hasPreviousPage} size="sm" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </Button>
            <Button className="flex-1 sm:flex-none" disabled={!documentResponse.pagination?.hasNextPage} size="sm" variant="outline" onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
