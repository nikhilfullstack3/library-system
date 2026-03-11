import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview" },
  { to: "/signup", label: "Library Signup" },
  { to: "/staff-login", label: "Staff Login" },
  { to: "/student-login", label: "Student Login" },
  { to: "/dashboard", label: "Dashboard" },
];

export function AppShell({ children, eyebrow, title, summary, aside }) {
  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <div className="page-grid" />

      <main className="relative mx-auto max-w-7xl px-5 py-6 md:px-8 lg:px-10">
        <header className="rounded-[32px] border border-white/8 bg-[rgba(10,15,26,0.82)] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <Link className="text-[11px] uppercase tracking-[0.45em] text-[var(--color-accent)]" to="/">
                Library System
              </Link>
              <p className="mt-5 text-[11px] uppercase tracking-[0.35em] text-white/45">{eyebrow}</p>
              <h1 className="mt-3 font-display text-4xl leading-[0.92] text-white md:text-6xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">{summary}</p>
            </div>

            <nav className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  className={({ isActive }) =>
                    `rounded-full border px-4 py-2 text-sm transition ${
                      isActive
                        ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/12 text-[var(--color-accent)]"
                        : "border-white/10 bg-white/4 text-white/72 hover:border-white/18 hover:bg-white/8"
                    }`
                  }
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        {aside ? <section className="mt-6">{aside}</section> : null}
        <section className="mt-6">{children}</section>
      </main>
    </div>
  );
}
