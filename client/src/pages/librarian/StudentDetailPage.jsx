import { ArrowLeft, CircleAlert, Download, IdCard, Mail, Phone, Upload, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN } from "../../lib/api";

function detailBadge(status) {
  if (status === "paid" || status === "verified") return "success";
  if (status === "pending" || status === "not verified") return "warning";
  return "secondary";
}

export function StudentDetailPage() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { fetchStudentById, updateStudent } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const backTarget = searchParams.get("from") || "/librarian/students";

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchStudentById(studentId);
        if (active) {
          setStudent(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load student details");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [fetchStudentById, studentId]);

  async function handleDocumentUpload(event) {
    event.preventDefault();

    if (!documentFile) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("document", documentFile);
      if (documentName.trim()) {
        formData.append("documentName", documentName.trim());
      }

      await updateStudent(studentId, formData);
      const refreshed = await fetchStudentById(studentId);
      setStudent(refreshed);
      setDocumentName("");
      setDocumentFile(null);
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload document");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading student details...</div>;
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <Button asChild className="rounded-full" variant="outline">
          <Link to={backTarget}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error || "Student not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild className="rounded-full" variant="outline">
        <Link to={backTarget}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Link>
      </Button>

      <Card className="overflow-hidden rounded-3xl border-emerald-100 bg-[radial-gradient(circle_at_top,#f8fff9_0%,#eef8f1_45%,#e5f4ea_100%)]">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
              <UserRound className="h-9 w-9" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">Student Details</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{student.name}</h1>
              <p className="mt-2 text-sm text-slate-600">
                Seat {student.seatNumber || "-"} • {student.shiftTiming || student.shift || "Shift not set"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={student.currentlyInLibrary ? "success" : "secondary"}>
              {student.currentlyInLibrary ? "Inside library" : "Outside"}
            </Badge>
            <Badge variant={detailBadge(student.paymentStatus)}>{student.paymentStatus || "unknown"}</Badge>
            <Badge variant={detailBadge(student.documentVerificationStatus)}>
              {student.documentVerificationStatus || "not uploaded"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label="Email" value={student.email || "-"} icon={Mail} />
            <Detail label="Phone" value={student.phone || "-"} icon={Phone} />
            <Detail label="Seat Number" value={student.seatNumber || "-"} icon={IdCard} />
            <Detail label="Hours Spent" value={String(student.hoursSpent || 0)} icon={CircleAlert} />
            <Detail label="Shift" value={student.shift || "-"} />
            <Detail label="Shift Timing" value={student.shiftTiming || "-"} />
            <Detail label="Login ID" value={student.loginId || "-"} />
            <Detail label="Password" value={student.issuedPassword || "Issued after payment"} />
            <div className="sm:col-span-2">
              <Detail label="Address" value={student.address || "-"} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4" onSubmit={handleDocumentUpload}>
              <Input
                onChange={(event) => setDocumentName(event.target.value)}
                placeholder="Document name, for example Aadhaar Card"
                value={documentName}
              />
              <Input
                onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                type="file"
              />
              <Button disabled={uploading || !documentFile} type="submit">
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Document"}
              </Button>
            </form>

            {student.uploadedDocuments?.length ? (
              student.uploadedDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{document.document}</p>
                    <p className="mt-1 text-xs text-slate-500">{document.fileName || "File attached"}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a
                      download
                      href={/^https?:\/\//i.test(document.fileUrl || "") ? document.fileUrl : `${API_ORIGIN}${document.fileUrl}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No documents uploaded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : null}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
