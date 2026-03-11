import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import {
  Badge,
  EmptyState,
  FormCard,
  Input,
  MetricCard,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  Select,
  StatusMessage,
} from "../components/ui";
import { useAppState } from "../context/AppState";

const initialStudentForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  shift: "Morning",
  paymentStatus: "pending",
  documents: "",
  hoursSpent: "0",
  currentlyInLibrary: "yes",
};

const initialLibrarianForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "librarian",
};

function formatDate(value) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatHours(value) {
  return `${Number(value || 0)} hrs`;
}

function parseDocuments(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function DashboardPage() {
  const { createLibrarian, createStudent, dashboard, logout, refreshDashboard, session, studentProfile } = useAppState();

  if (!session) {
    return <Navigate replace to="/" />;
  }

  if (session.role === "student" && studentProfile) {
    return <StudentDashboard onLogout={logout} student={studentProfile} />;
  }

  if (!dashboard) {
    return <Navigate replace to="/" />;
  }

  return <StaffDashboard createLibrarian={createLibrarian} createStudent={createStudent} dashboard={dashboard} logout={logout} refreshDashboard={refreshDashboard} session={session} />;
}

function StaffDashboard({ createLibrarian, createStudent, dashboard, logout, refreshDashboard, session }) {
  const isAdmin = session.role === "admin";
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [librarianForm, setLibrarianForm] = useState(initialLibrarianForm);
  const [state, setState] = useState({ loading: false, message: "", error: "" });

  async function handleStudentSubmit(event) {
    event.preventDefault();
    setState({ loading: true, message: "", error: "" });

    try {
      const data = await createStudent({
        ...studentForm,
        documents: parseDocuments(studentForm.documents),
        hoursSpent: Number(studentForm.hoursSpent) || 0,
        currentlyInLibrary: studentForm.currentlyInLibrary === "yes",
      });

      setStudentForm(initialStudentForm);
      setState({
        loading: false,
        message: `${data.student.name} added successfully.`,
        error: "",
      });
    } catch (error) {
      setState({
        loading: false,
        message: "",
        error: error.message || "Unable to add student",
      });
    }
  }

  async function handleLibrarianSubmit(event) {
    event.preventDefault();
    setState({ loading: true, message: "", error: "" });

    try {
      const data = await createLibrarian(librarianForm);
      setLibrarianForm(initialLibrarianForm);
      setState({
        loading: false,
        message: `${data.librarian.name} can now log in.`,
        error: "",
      });
    } catch (error) {
      setState({
        loading: false,
        message: "",
        error: error.message || "Unable to add librarian",
      });
    }
  }

  return (
    <AppShell
      eyebrow={isAdmin ? "Admin Dashboard" : "Librarian Dashboard"}
      title={dashboard.library.name}
      summary={
        isAdmin
          ? "Admin view includes roster management plus live stats for students, payments, documents, and current occupancy."
          : "Librarian view keeps the focus on operations: roster, current occupancy, shifts, and payment visibility."
      }
      aside={
        <div className="flex flex-wrap gap-3">
          <SecondaryButton onClick={() => refreshDashboard()} type="button">
            Refresh dashboard
          </SecondaryButton>
          <SecondaryButton onClick={logout} type="button">
            Logout
          </SecondaryButton>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard hint="Student accounts linked to this library" label="Students" value={dashboard.stats.totalStudents} />
        <MetricCard hint="Students currently checked in" label="Inside now" value={dashboard.stats.currentStudents} />
        <MetricCard hint="Accounts with cleared payment" label="Paid" value={dashboard.stats.paidStudents} />
        <MetricCard hint="Students needing follow-up" label="Pending" value={dashboard.stats.pendingPayments} />
        <MetricCard hint="Total tracked study time" label="Hours" value={formatHours(dashboard.stats.totalHours)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <FormCard>
          <SectionTitle eyebrow="Student Records" title="Roster" />
          <div className="mt-5 space-y-4">
            {dashboard.students.length === 0 ? <EmptyState label="No students added yet." /> : null}
            {dashboard.students.map((student) => (
              <article key={student.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-2xl text-white">{student.name}</h3>
                      <Badge tone={student.currentlyInLibrary ? "success" : "neutral"}>
                        {student.currentlyInLibrary ? "in library" : "outside"}
                      </Badge>
                      <Badge tone={student.paymentStatus}>{student.paymentStatus}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-white/68 md:grid-cols-2">
                      <p>{student.email}</p>
                      <p>{student.phone}</p>
                      <p>Shift: {student.shift}</p>
                      <p>Hours spent: {formatHours(student.hoursSpent)}</p>
                    </div>
                  </div>

                  <div className="min-w-60 rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">Documents</p>
                    <p className="mt-3 text-sm leading-6 text-white/70">
                      {student.documents.length ? student.documents.join(", ") : "No documents uploaded"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </FormCard>

        <div className="space-y-6">
          <FormCard>
            <SectionTitle eyebrow="Occupancy" title="Currently inside" />
            <div className="mt-5 space-y-3">
              {dashboard.currentStudents.length === 0 ? <EmptyState label="No active students right now." /> : null}
              {dashboard.currentStudents.map((student) => (
                <article key={student.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{student.name}</p>
                      <p className="mt-1 text-sm text-white/60">
                        {student.shift} shift • {formatHours(student.hoursSpent)}
                      </p>
                    </div>
                    <Badge tone="success">present</Badge>
                  </div>
                </article>
              ))}
            </div>
          </FormCard>

          <FormCard>
            <SectionTitle eyebrow="Staff" title="Librarians" />
            <div className="mt-5 space-y-3">
              {dashboard.librarians.map((librarian) => (
                <article key={librarian.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{librarian.name}</p>
                    <Badge tone={librarian.role === "admin" ? "accent" : "neutral"}>{librarian.role}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-white/60">{librarian.email}</p>
                  <p className="mt-1 text-sm text-white/60">{librarian.phone || "No phone provided"}</p>
                </article>
              ))}
            </div>
          </FormCard>

          {isAdmin ? (
            <>
              <form onSubmit={handleStudentSubmit}>
                <FormCard>
                  <SectionTitle eyebrow="Admin Action" title="Add student" />
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Input label="Name" onChange={(value) => setStudentForm((current) => ({ ...current, name: value }))} value={studentForm.name} />
                    <Input label="Phone" onChange={(value) => setStudentForm((current) => ({ ...current, phone: value }))} value={studentForm.phone} />
                    <Input label="Email" onChange={(value) => setStudentForm((current) => ({ ...current, email: value }))} type="email" value={studentForm.email} />
                    <Input label="Password" onChange={(value) => setStudentForm((current) => ({ ...current, password: value }))} type="password" value={studentForm.password} />
                    <Select label="Shift" onChange={(value) => setStudentForm((current) => ({ ...current, shift: value }))} options={["Morning", "Evening", "Full Day", "Night"]} value={studentForm.shift} />
                    <Select label="Payment" onChange={(value) => setStudentForm((current) => ({ ...current, paymentStatus: value }))} options={["paid", "pending", "overdue"]} value={studentForm.paymentStatus} />
                    <Input label="Hours spent" onChange={(value) => setStudentForm((current) => ({ ...current, hoursSpent: value }))} type="number" value={studentForm.hoursSpent} />
                    <Select label="In library now" onChange={(value) => setStudentForm((current) => ({ ...current, currentlyInLibrary: value }))} options={["yes", "no"]} value={studentForm.currentlyInLibrary} />
                  </div>
                  <Input className="mt-4" label="Documents" onChange={(value) => setStudentForm((current) => ({ ...current, documents: value }))} placeholder="Aadhaar Card, College ID" value={studentForm.documents} />
                  <PrimaryButton className="mt-6 w-full" disabled={state.loading} type="submit">
                    {state.loading ? "Saving..." : "Create student"}
                  </PrimaryButton>
                </FormCard>
              </form>

              <form onSubmit={handleLibrarianSubmit}>
                <FormCard>
                  <SectionTitle eyebrow="Admin Action" title="Add librarian" />
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Input label="Name" onChange={(value) => setLibrarianForm((current) => ({ ...current, name: value }))} value={librarianForm.name} />
                    <Input label="Phone" onChange={(value) => setLibrarianForm((current) => ({ ...current, phone: value }))} value={librarianForm.phone} />
                    <Input label="Email" onChange={(value) => setLibrarianForm((current) => ({ ...current, email: value }))} type="email" value={librarianForm.email} />
                    <Input label="Password" onChange={(value) => setLibrarianForm((current) => ({ ...current, password: value }))} type="password" value={librarianForm.password} />
                    <Select label="Role" onChange={(value) => setLibrarianForm((current) => ({ ...current, role: value }))} options={["librarian", "admin"]} value={librarianForm.role} />
                  </div>
                  <PrimaryButton className="mt-6 w-full" disabled={state.loading} type="submit">
                    {state.loading ? "Saving..." : "Create librarian"}
                  </PrimaryButton>
                  <StatusMessage error={state.error} message={state.message} />
                </FormCard>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function StudentDashboard({ onLogout, student }) {
  return (
    <AppShell
      eyebrow="Student Dashboard"
      title={student.name}
      summary="Students now land on a focused page showing only their own profile, payment status, shift, documents, and time spent."
      aside={
        <div className="flex justify-start">
          <SecondaryButton onClick={onLogout} type="button">
            Logout
          </SecondaryButton>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Shift" value={student.shift} />
        <MetricCard label="Hours spent" value={formatHours(student.hoursSpent)} />
        <MetricCard label="Payment" value={student.paymentStatus} />
        <MetricCard label="Inside now" value={student.currentlyInLibrary ? "Yes" : "No"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <FormCard>
          <SectionTitle eyebrow="Profile" title="Student details" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <DetailCard label="Library" value={student.library?.name || "Assigned library"} />
            <DetailCard label="Email" value={student.email} />
            <DetailCard label="Phone" value={student.phone} />
            <DetailCard label="Joined" value={formatDate(student.createdAt)} />
          </div>
        </FormCard>

        <FormCard>
          <SectionTitle eyebrow="Documents" title="Uploaded records" />
          <div className="mt-5 space-y-3">
            {student.documents?.length ? (
              student.documents.map((document) => (
                <article key={document} className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-white/72">
                  {document}
                </article>
              ))
            ) : (
              <EmptyState label="No documents uploaded." />
            )}
          </div>
        </FormCard>
      </div>
    </AppShell>
  );
}

function DetailCard({ label, value }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">{label}</p>
      <p className="mt-3 text-sm text-white/74">{value}</p>
    </article>
  );
}
