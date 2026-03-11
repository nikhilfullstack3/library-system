import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { FormCard, MetricCard, SecondaryButton } from "../components/ui";
import { useAppState } from "../context/AppState";

function formatDate(value) {
  if (!value) {
    return "No recent signup";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function HomePage() {
  const { libraries, librariesError, librariesLoading, session } = useAppState();
  const latestLibrary = libraries[0];

  return (
    <AppShell
      eyebrow="System Overview"
      title="Use separate pages for signup, role login, and focused dashboards."
      summary="The interface is split into clear routes so each task has room to breathe. Library admins manage staff and students, librarians monitor the floor, and students only see their own profile."
      aside={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard hint="Libraries in the system" label="Registered" value={libraries.length} />
          <MetricCard hint="Most recent onboarding" label="Latest" value={formatDate(latestLibrary?.createdAt)} />
          <MetricCard hint="Current saved session" label="Mode" value={session?.role || "Guest"} />
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-6 md:grid-cols-3">
          <LandingCard
            description="Create a library and go directly to the admin dashboard."
            href="/signup"
            label="Library Signup"
          />
          <LandingCard
            description="Admins and librarians use a dedicated staff login screen."
            href="/staff-login"
            label="Staff Login"
          />
          <LandingCard
            description="Students use a separate login and land on a personal dashboard."
            href="/student-login"
            label="Student Login"
          />
        </section>

        <FormCard>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--color-accent-soft)]">Network Snapshot</p>
          <h2 className="mt-3 font-display text-3xl text-white">Libraries already added</h2>
          <div className="mt-5 space-y-3">
            {librariesLoading ? <p className="text-sm text-white/60">Loading libraries...</p> : null}
            {!librariesLoading && librariesError ? <p className="text-sm text-rose-200">{librariesError}</p> : null}
            {!librariesLoading && !librariesError && libraries.length === 0 ? (
              <p className="text-sm text-white/60">No libraries registered yet.</p>
            ) : null}
            {!librariesLoading && !librariesError
              ? libraries.slice(0, 5).map((library) => (
                  <article key={library._id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl text-white">{library.name}</h3>
                        <p className="mt-2 text-sm text-white/60">{library.contactEmail}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">
                        {formatDate(library.createdAt)}
                      </span>
                    </div>
                  </article>
                ))
              : null}
          </div>
        </FormCard>
      </div>
    </AppShell>
  );
}

function LandingCard({ href, label, description }) {
  return (
    <FormCard>
      <h2 className="font-display text-3xl text-white">{label}</h2>
      <p className="mt-3 text-sm leading-7 text-white/66">{description}</p>
      <Link className="mt-6 inline-block" to={href}>
        <SecondaryButton type="button">{label}</SecondaryButton>
      </Link>
    </FormCard>
  );
}
