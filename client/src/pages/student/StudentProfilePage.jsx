import { ArrowLeft, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";

const apiBaseUrl = "http://127.0.0.1:5001";

export function StudentProfilePage() {
  const {
    changeStudentPassword,
    refreshStudentData,
    session,
    studentData,
    updateStudentProfile,
  } = useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    shift: "",
    shiftTiming: "",
    photo: null,
    document: null,
  });
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (session?.studentId) {
      refreshStudentData(session.studentId);
    }
  }, [refreshStudentData, session]);

  useEffect(() => {
    setProfileForm({
      name: studentData?.student.name || "",
      email: studentData?.student.email || "",
      phone: studentData?.student.phone || "",
      address: studentData?.student.address || "",
      shift: studentData?.student.shift || "",
      shiftTiming: studentData?.student.shiftTiming || "",
      photo: null,
      document: null,
    });
  }, [studentData]);

  return (
    <div className="min-h-screen bg-[#f3fbf5]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button className="rounded-full" onClick={() => navigate("/student")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chat
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-3xl border-emerald-100 bg-[radial-gradient(circle_at_top,#f8fff9_0%,#eff8f2_44%,#e6f4ea_100%)] shadow-[0_18px_48px_rgba(22,101,52,0.08)]">
              <CardContent className="relative flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:items-center sm:text-left xl:flex-col xl:text-center">
                <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-emerald-200/35 blur-3xl" />
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-lime-100/70 blur-3xl" />
                {studentData?.student.profilePhotoUrl ? (
                  <img
                    alt={studentData?.student.name || "Profile"}
                    className="relative h-24 w-24 rounded-3xl object-cover ring-4 ring-white/90"
                    src={`${apiBaseUrl}${studentData.student.profilePhotoUrl}`}
                  />
                ) : (
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
                    <UserRound className="h-10 w-10" />
                  </div>
                )}
                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                    Student Profile
                  </p>
                  <h1 className="mt-2 bg-[linear-gradient(135deg,#0f5132_0%,#2d7a4f_50%,#5c9c67_100%)] bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                    {studentData?.student?.library?.name || "Your Library"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    {studentData?.student.name} • {studentData?.student.email}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Seat {studentData?.student.seatNumber || "-"} • {studentData?.student.shift || "Shift not set"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <ProfileEditor form={profileForm} onSave={updateStudentProfile} setForm={setProfileForm} />
            <PasswordEditor onSave={changeStudentPassword} password={password} setPassword={setPassword} />
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Detail label="Login ID" value={studentData?.student.loginId || "Issued after payment"} />
                <Detail label="Current Password" value={studentData?.student.issuedPassword || "Issued after payment"} />
                <Detail label="Phone" value={studentData?.student.phone || "-"} />
                <Detail label="Shift" value={studentData?.student.shift || "-"} />
                <Detail label="Shift Timing" value={studentData?.student.shiftTiming || "-"} />
                <Detail label="Address" value={studentData?.student.address || "-"} />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {studentData?.uploadedDocuments?.length ? (
                  studentData.uploadedDocuments.map((document) => (
                    <a
                      key={document.id}
                      className="block rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
                      href={`${apiBaseUrl}${document.fileUrl}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {document.document}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentData?.payments?.length ? (
                      studentData.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.month}</TableCell>
                          <TableCell>Rs {payment.amount}</TableCell>
                          <TableCell className="capitalize">{payment.status}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-slate-500" colSpan={3}>
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({ form, onSave, setForm }) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-3xl border-emerald-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Name">
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </Field>
          <Field label="Shift">
            <Input value={form.shift} onChange={(event) => setForm((current) => ({ ...current, shift: event.target.value }))} />
          </Field>
          <Field label="Shift Timing">
            <Input value={form.shiftTiming} onChange={(event) => setForm((current) => ({ ...current, shiftTiming: event.target.value }))} />
          </Field>
          <Field label="Photo">
            <Input type="file" onChange={(event) => setForm((current) => ({ ...current, photo: event.target.files?.[0] || null }))} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address">
              <Input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Add Document">
              <Input type="file" onChange={(event) => setForm((current) => ({ ...current, document: event.target.files?.[0] || null }))} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordEditor({ onSave, password, setPassword }) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!password.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(password.trim());
      setPassword("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-3xl border-emerald-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="New Password">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Button disabled={saving} type="submit">
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ children, label }) {
  return (
    <label className="block">
      <Label className="mb-2 block">{label}</Label>
      {children}
    </label>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-emerald-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{label}</p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}
