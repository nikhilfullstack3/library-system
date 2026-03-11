import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { FormCard, Input, PrimaryButton, SectionTitle, StatusMessage } from "../components/ui";
import { useAppState } from "../context/AppState";

const initialForm = {
  email: "",
  password: "",
};

export function StaffLoginPage() {
  const navigate = useNavigate();
  const { loginStaff } = useAppState();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ loading: false, message: "", error: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ loading: true, message: "", error: "" });

    try {
      const data = await loginStaff(form);
      setForm(initialForm);
      setState({
        loading: false,
        message: `Logged in as ${data.librarian.role}. Redirecting...`,
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
      eyebrow="Staff Login"
      title="Admins and librarians get an operational dashboard, not the public landing page."
      summary="This route is only for library staff. The returned role determines whether the dashboard shows management controls or monitoring-only tools."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit}>
          <FormCard>
            <SectionTitle eyebrow="Staff Access" title="Sign in" />
            <div className="mt-6 space-y-4">
              <Input label="Email" onChange={(value) => setForm((current) => ({ ...current, email: value }))} placeholder="staff@library.com" type="email" value={form.email} />
              <Input label="Password" onChange={(value) => setForm((current) => ({ ...current, password: value }))} placeholder="Enter your password" type="password" value={form.password} />
            </div>
            <PrimaryButton className="mt-6 w-full" disabled={state.loading} type="submit">
              {state.loading ? "Signing in..." : "Staff login"}
            </PrimaryButton>
            <StatusMessage error={state.error} message={state.message} />
          </FormCard>
        </form>

        <FormCard className="grid gap-4 md:grid-cols-2">
          <InfoBlock title="Admin dashboard" value="Can add students and librarians, plus see complete payment and occupancy data." />
          <InfoBlock title="Librarian dashboard" value="Sees current students, shifts, documents, payments, and who is in the library." />
          <InfoBlock title="Routing" value="After login the app sends staff to one dashboard route with role-aware content." />
          <InfoBlock title="UI change" value="Forms are isolated so the screen is simpler and faster to scan." />
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
