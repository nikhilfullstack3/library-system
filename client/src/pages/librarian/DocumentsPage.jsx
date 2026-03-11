import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";

export function DocumentsPage() {
  const { libraryData } = useAuth();

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
            {libraryData?.documents.map((document) => (
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
      </CardContent>
    </Card>
  );
}
