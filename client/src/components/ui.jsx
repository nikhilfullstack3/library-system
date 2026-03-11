export function FormCard({ children, className = "" }) {
  return <section className={`rounded-[28px] border border-white/10 bg-[rgba(9,14,24,0.78)] p-6 ${className}`}>{children}</section>;
}

export function SectionTitle({ eyebrow, title, description }) {
  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--color-accent-soft)]">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl text-white">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-7 text-white/68">{description}</p> : null}
    </>
  );
}

export function Input({ label, onChange, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/22 focus:border-[var(--color-accent)]/50 focus:bg-black/30"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function Select({ label, options, onChange, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      <select
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)]/50 focus:bg-black/30"
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} className="bg-slate-950" value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-full bg-[linear-gradient(135deg,var(--color-accent),#f6b457)] px-5 py-3 font-semibold text-[#2d1d07] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-full border border-white/12 bg-white/5 px-5 py-3 text-white/78 transition hover:-translate-y-0.5 hover:bg-white/10 ${className}`}
    >
      {children}
    </button>
  );
}

export function StatusMessage({ error, message }) {
  if (!error && !message) {
    return null;
  }

  return (
    <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${error ? "bg-rose-500/14 text-rose-200" : "bg-emerald-500/14 text-emerald-200"}`}>
      {error || message}
    </p>
  );
}

export function MetricCard({ label, value, hint }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/6 p-5">
      <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">{label}</p>
      <p className="mt-3 font-display text-4xl text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-white/60">{hint}</p> : null}
    </article>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const styles = {
    neutral: "border-white/12 bg-white/7 text-white/72",
    success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    pending: "border-amber-400/25 bg-amber-400/10 text-amber-100",
    overdue: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    accent: "border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  };

  return <span className={`rounded-full border px-3 py-1 text-xs capitalize ${styles[tone] || styles.neutral}`}>{children}</span>;
}

export function EmptyState({ label }) {
  return <div className="rounded-[24px] border border-dashed border-white/12 bg-white/4 px-4 py-8 text-center text-sm text-white/52">{label}</div>;
}
