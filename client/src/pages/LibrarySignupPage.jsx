import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { FormCard, Input, PrimaryButton, SectionTitle, StatusMessage } from "../components/ui";
import { useAppState } from "../context/AppState";

const initialForm = {
  name: "",
  email: "",
  password: "",
  libraryName: "",
};

export function LibrarySignupPage() {
  const navigate = useNavigate();
  const { registerLibrary } = useAppState();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ loading: false, message: "", error: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ loading: true, message: "", error: "" });

    try {
      await registerLibrary(form);
      setForm(initialForm);
      setState({
        loading: false,
        message: "Library created. Redirecting to admin dashboard.",
        error: "",
      });
      navigate("/dashboard");
    } catch (error) {
      setState({
        loading: false,
        message: "",
        error: error.message || "Unable to register library",
      });
    }
  }

  return (
    <AppShell
      eyebrow="Library Signup"
      title="Create the library first, then manage everything from a proper admin page."
      summary="This page only handles onboarding. After signup, the app moves to a dedicated dashboard instead of mixing forms and tables on the same screen."
    >
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={handleSubmit}>
          <FormCard>
            <SectionTitle
              description="The account created here becomes the library admin. Demo students are seeded automatically for quick testing."
              eyebrow="Admin Account"
              title="New library"
            />
            <div className="mt-6 space-y-4">
              <Input label="Admin name" onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Nikhil Sharma" value={form.name} />
              <Input label="Admin email" onChange={(value) => setForm((current) => ({ ...current, email: value }))} placeholder="admin@library.com" type="email" value={form.email} />
              <Input label="Password" onChange={(value) => setForm((current) => ({ ...current, password: value }))} placeholder="Create a strong password" type="password" value={form.password} />
              <Input label="Library name" onChange={(value) => setForm((current) => ({ ...current, libraryName: value }))} placeholder="Scholars Reading Hall" value={form.libraryName} />
            </div>
            <PrimaryButton className="mt-6 w-full" disabled={state.loading} type="submit">
              {state.loading ? "Creating..." : "Create library"}
            </PrimaryButton>
            <StatusMessage error={state.error} message={state.message} />
          </FormCard>
        </form>

        <FormCard className="grid gap-4 md:grid-cols-2">
          <InfoBlock title="What happens next" value="You are redirected to the admin dashboard for that library." />
          <InfoBlock title="Admin can add" value="Students, librarians, documents, shifts, and payment records." />
          <InfoBlock title="Demo student password" value="student123" />
          <InfoBlock title="Design change" value="Signup is now isolated from login and reporting screens." />
        </FormCard>
      </div>
    </AppShell>
  );
}

function InfoBlock({ title, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
      <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">{title}</p>
      <p className="mt-3 text-lg text-white/82">{value}</p>
    </div>
  );
}
