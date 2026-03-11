import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { FormCard, Input, PrimaryButton, SectionTitle, StatusMessage } from "../components/ui";
import { useAppState } from "../context/AppState";

const initialForm = {
  email: "",
  password: "",
};

export function StudentLoginPage() {
  const navigate = useNavigate();
  const { loginStudent } = useAppState();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ loading: false, message: "", error: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ loading: true, message: "", error: "" });

    try {
      await loginStudent(form);
      setForm(initialForm);
      setState({
        loading: false,
        message: "Student login successful. Redirecting...",
        error: "",
      });
      navigate("/dashboard");
    } catch (error) {
      setState({
        loading: false,
        message: "",
        error: error.message || "Unable to login",
      });
    }
  }

  return (
    <AppShell
      eyebrow="Student Login"
      title="Students get a lean personal dashboard with hours, shift, documents, and payment status."
      summary="This page avoids showing operational data meant for staff. Students see only their own account details after login."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit}>
          <FormCard>
            <SectionTitle eyebrow="Student Access" title="Sign in" />
            <div className="mt-6 space-y-4">
              <Input label="Email" onChange={(value) => setForm((current) => ({ ...current, email: value }))} placeholder="student@library.com" type="email" value={form.email} />
              <Input label="Password" onChange={(value) => setForm((current) => ({ ...current, password: value }))} placeholder="Enter your password" type="password" value={form.password} />
            </div>
            <PrimaryButton className="mt-6 w-full" disabled={state.loading} type="submit">
              {state.loading ? "Signing in..." : "Student login"}
            </PrimaryButton>
            <StatusMessage error={state.error} message={state.message} />
          </FormCard>
        </form>

        <FormCard className="grid gap-4 md:grid-cols-2">
          <InfoBlock title="Shows" value="Shift, hours spent, payment status, phone number, and documents." />
          <InfoBlock title="Does not show" value="Other students or staff-only management actions." />
          <InfoBlock title="For testing" value="New libraries receive demo students automatically." />
          <InfoBlock title="Result" value="Cleaner UX with distinct screens instead of one crowded page." />
        </FormCard>
      </div>
    </AppShell>
  );
}

function InfoBlock({ title, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
      <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">{title}</p>
      <p className="mt-3 text-white/82">{value}</p>
    </div>
  );
}
