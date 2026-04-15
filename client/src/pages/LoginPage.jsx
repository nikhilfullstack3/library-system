import { BookOpenCheck, Eye, EyeOff, GraduationCap, ShieldCheck, Sparkles, SquareLibrary, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { authError, login, setAuthError } = useAuth();
  const [role, setRole] = useState("librarian");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setAuthError("");

    try {
      const session = await login(role, email, password);
      navigate(session.role === "student" ? "/student" : "/librarian");
    } catch (error) {
      setAuthError(error.message || "Unable to login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left side - Hero */}
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Library Study Room Management
            </div>
            <h1 className="mt-6 font-display text-6xl font-extrabold leading-[1.05] tracking-tight">
              The cleanest way to <span className="text-gradient">manage</span> your study room.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Track students, seats, attendance, payments, and documents — all from one beautifully simple dashboard.
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
              title="Live updates"
              description="Real-time chat, attendance and seat occupancy across web and mobile."
            />
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="mx-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.4)] backdrop-blur-2xl">
            {/* Brand mark */}
            <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
              <SquareLibrary className="h-7 w-7" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 ring-4 ring-white">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </span>
            </div>

            <div className="text-center">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">Sign in to continue to your dashboard</p>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              {/* Role tabs */}
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/80 p-1">
                {[
                  { key: "librarian", label: "Librarian" },
                  { key: "student", label: "Student" },
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`rounded-xl px-3 py-2 text-xs font-bold tracking-tight transition-all ${
                      role === item.key
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    type="button"
                    onClick={() => setRole(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {role === "student" ? "Email or Login ID" : "Email"}
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "student" ? "student email or login ID" : "you@example.com"}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 pr-12 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-extrabold tracking-tight text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? "Signing in..." : (
                  <>
                    Sign in as {role === "super_admin" ? "Admin" : role === "student" ? "Student" : "Librarian"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {authError ? (
              <div className="mt-4 rounded-2xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {authError}
              </div>
            ) : null}

            <p className="mt-6 text-center text-xs text-slate-400">
              By signing in you agree to our{" "}
              <Link to="/terms" className="font-semibold text-emerald-600 hover:text-teal-700 underline underline-offset-2">
                Terms &amp; Conditions
              </Link>
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">New here?</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              to="/signup"
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500 bg-white text-sm font-extrabold text-emerald-700 transition-all hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.98]"
            >
              Register your library
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ description, icon: Icon, title }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
