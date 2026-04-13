import { ArrowRight, Eye, EyeOff, Sparkles, SquareLibrary } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialForm = { name: "", email: "", password: "", libraryName: "" };

export function LibrarySignupPage() {
  const navigate = useNavigate();
  const { createLibraryAccount } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set(field) {
    return (e) => { setForm((f) => ({ ...f, [field]: e.target.value })); setError(""); };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.libraryName.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await createLibraryAccount(form);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Unable to register library.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
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
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">Register your library</h2>
              <p className="mt-1.5 text-sm text-slate-500">Create your library account and get started</p>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              {[
                { label: "Your name", field: "name", placeholder: "Nikhil Sharma", type: "text" },
                { label: "Email", field: "email", placeholder: "admin@library.com", type: "email" },
                { label: "Library name", field: "libraryName", placeholder: "Scholars Reading Hall", type: "text" },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={set(field)}
                    placeholder={placeholder}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Create a strong password"
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

              <button
                type="submit"
                disabled={submitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-extrabold tracking-tight text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? "Creating..." : (
                  <>
                    Create library
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <p className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-emerald-600 hover:text-teal-700 underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
