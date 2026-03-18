import { BookOpenCheck, GraduationCap, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { authError, login, setAuthError } = useAuth();
  const [role, setRole] = useState("librarian");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setAuthError("");

    try {
      const session = await login(role, email, password);
      navigate(session.role === "student" ? "/student" : session.role === "super_admin" ? "/super-admin" : "/librarian");
    } catch (error) {
      setAuthError(error.message || "Unable to login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(110,231,183,0.22),transparent_30%),linear-gradient(180deg,#fbfffc_0%,#effaf2_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <p className="inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-1 text-sm font-medium text-emerald-700 shadow-sm">
              Modern Library Study Room Management
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-900">
              A cleaner admin and student experience for managing study rooms.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Built as a modern dashboard with soft colors, responsive layout, sidebar navigation, cards, tables, and dialogs.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            <FeatureCard
              icon={ShieldCheck}
              title="Librarian dashboard"
              description="Track students, seats, attendance, payments, and documents from one sidebar-driven admin UI."
            />
            <FeatureCard
              icon={GraduationCap}
              title="Student dashboard"
              description="Students see their seat number, attendance history, payment status, and uploaded documents."
            />
            <FeatureCard
              icon={BookOpenCheck}
              title="Demo login rule"
              description="Use any email containing 'student' to enter the student view. Other emails open librarian mode."
            />
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md rounded-[28px] border-white/70 bg-white/90 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.28)] backdrop-blur-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <BookOpenCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-3xl">Welcome back</CardTitle>
            <CardDescription>Login to continue to your library dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
                {["librarian", "student", "super_admin"].map((item) => (
                  <button
                    key={item}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      role === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                    type="button"
                    onClick={() => setRole(item)}
                  >
                    {item === "librarian" ? "Librarian" : item === "student" ? "Student" : "Super Admin"}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>{role === "student" ? "Email or Login ID" : "Email"}</Label>
                <Input placeholder={role === "student" ? "student email or issued login ID" : "you@example.com"} type="text" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input placeholder="Enter password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <Button className="h-11 w-full rounded-2xl" disabled={submitting}>
                {submitting ? "Logging in..." : `Login as ${role}`}
              </Button>
            </form>

            {authError ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</p> : null}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Demo access: librarian `admin@library.com` / `admin123`, super admin `superadmin@library.com` / `super123`. Student login ID and password are issued when payment is marked paid and can be seen in the student profile.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({ description, icon: Icon, title }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
