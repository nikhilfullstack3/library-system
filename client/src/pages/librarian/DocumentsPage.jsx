import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";

export function DocumentsPage() {
  const { fetchDocuments } = useAuth();
  const [page, setPage] = useState(1);
  const [documentResponse, setDocumentResponse] = useState({ items: [], pagination: null });

  useEffect(() => {
    fetchDocuments({ page, limit: 25 }).then(setDocumentResponse).catch(() => {});
  }, [fetchDocuments, page]);

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <p className="mt-1 text-sm text-slate-500">Review uploaded student documents and verification status.</p>
      </CardHeader>
      <CardContent>
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
                <TableCell className="font-medium text-slate-900">{document.student}</TableCell>
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
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {documentResponse.pagination?.page || 1} of {documentResponse.pagination?.totalPages || 1}
          </span>
          <div className="flex gap-2">
            <Button disabled={!documentResponse.pagination?.hasPreviousPage} size="sm" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </Button>
            <Button disabled={!documentResponse.pagination?.hasNextPage} size="sm" variant="outline" onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
