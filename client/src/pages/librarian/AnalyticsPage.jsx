import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FlaskConical,
  IndianRupee,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const PERIODS = [
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
];

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "revenue", label: "Revenue", icon: IndianRupee },
  { id: "renewals", label: "Renewals", icon: RefreshCw },
];

function StatCard({ icon: Icon, label, value, sub, trend, color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-extrabold text-slate-900">{value}</p>
            {trend !== undefined && (
              <span className={`flex items-center text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, valueKey = "collected", secondaryKey, maxBarHeight = 160 }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d[valueKey] || 0, d[secondaryKey] || 0)), 1);

  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: maxBarHeight + 40 }}>
      {data.map((item, i) => {
        const primary = item[valueKey] || 0;
        const secondary = secondaryKey ? item[secondaryKey] || 0 : 0;
        const primaryHeight = Math.max((primary / maxVal) * maxBarHeight, primary > 0 ? 4 : 0);
        const secondaryHeight = secondaryKey ? Math.max((secondary / maxVal) * maxBarHeight, secondary > 0 ? 4 : 0) : 0;

        return (
          <div key={i} className="flex min-w-[48px] flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-slate-500">
              {primary > 0 ? `${(primary / 1000).toFixed(primary >= 1000 ? 1 : 0)}k` : "0"}
            </span>
            <div className="flex items-end gap-0.5">
              <div
                className="w-5 rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ height: primaryHeight }}
                title={`Collected: Rs ${primary.toLocaleString()}`}
              />
              {secondaryKey && (
                <div
                  className="w-5 rounded-t-md bg-gradient-to-t from-amber-400 to-amber-300 transition-all duration-500"
                  style={{ height: secondaryHeight }}
                  title={`Pending: Rs ${secondary.toLocaleString()}`}
                />
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-400">{item.label?.split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

function CollectionRing({ rate }) {
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={100} height={100} className="-rotate-90">
        <circle cx={50} cy={50} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={rate >= 70 ? "#10b981" : rate >= 40 ? "#f59e0b" : "#ef4444"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{rate}%</p>
      <p className="text-xs text-slate-500">Collection Rate</p>
    </div>
  );
}

function formatRupees(amount) {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return String(amount);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function AnalyticsPage() {
  const { fetchAnalytics, seedAnalyticsDemo, session } = useAuth();
  const [period, setPeriod] = useState("6m");
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  const isAdmin = session?.role === "admin" || session?.role === "super_admin";

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAnalytics(period)
      .then((result) => { if (active) setData(result); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchAnalytics, period]);

  async function handleSeedDemo() {
    setSeedError("");
    setSeeding(true);
    try {
      await seedAnalyticsDemo();
      // Re-fetch after seeding
      const result = await fetchAnalytics(period);
      setData(result);
    } catch (err) {
      setSeedError(err?.message || "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  const summary = data?.summary || {};
  const monthly = data?.monthly || [];
  const renewals = data?.renewals || [];

  const monthlyTrend = useMemo(() => {
    if (monthly.length < 2) return undefined;
    const prev = monthly[monthly.length - 2]?.collected || 0;
    const curr = monthly[monthly.length - 1]?.collected || 0;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }, [monthly]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-500">Revenue, collections & renewal insights</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                title="Load 9 months of demo payment history"
              >
                {seeding ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" />
                ) : (
                  <FlaskConical className="h-3.5 w-3.5" />
                )}
                {seeding ? "Seeding…" : "Load Demo Data"}
              </button>
              {seedError && <p className="text-[11px] font-medium text-rose-500">{seedError}</p>}
            </div>
          )}
        <div className="flex gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                period === p.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                tab === t.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        </div>
      )}

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={IndianRupee}
              label="Total Collected"
              value={`Rs ${formatRupees(summary.totalCollected || 0)}`}
              trend={monthlyTrend}
              color="emerald"
            />
            <StatCard
              icon={Clock}
              label="Pending"
              value={`Rs ${formatRupees(summary.totalPending || 0)}`}
              sub={`${summary.pendingCount || 0} payments`}
              color="amber"
            />
            <StatCard
              icon={Users}
              label="Avg / Student"
              value={`Rs ${formatRupees(summary.avgPerStudent || 0)}`}
              color="sky"
            />
            <StatCard
              icon={CheckCircle2}
              label="Collection Rate"
              value={`${summary.collectionRate || 0}%`}
              sub={`${summary.paidCount || 0} of ${(summary.paidCount || 0) + (summary.pendingCount || 0)}`}
              color={summary.collectionRate >= 70 ? "emerald" : "rose"}
            />
          </div>

          {/* Chart + Ring */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Monthly Revenue</h3>
                <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Collected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Pending
                  </span>
                </div>
              </div>
              {monthly.length > 0 ? (
                <BarChart data={monthly} valueKey="collected" secondaryKey="pending" />
              ) : (
                <div className="flex flex-col items-center gap-3 py-12">
                  <p className="text-sm text-slate-400">No payment data for this period</p>
                  {isAdmin && (
                    <button
                      onClick={handleSeedDemo}
                      disabled={seeding}
                      className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      Load Demo Data
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5">
              <CollectionRing rate={summary.collectionRate || 0} />
              <div className="mt-4 w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-bold text-emerald-600">{summary.paidCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pending</span>
                  <span className="font-bold text-amber-600">{summary.pendingCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Overdue</span>
                  <span className="font-bold text-rose-500">{summary.overdueCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Revenue Tab ── */}
      {tab === "revenue" && (
        <div className="space-y-4">
          {/* Revenue summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-center">
              <p className="text-3xl font-extrabold text-emerald-700">Rs {(summary.totalCollected || 0).toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-emerald-600/80">Total Collected</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-center">
              <p className="text-3xl font-extrabold text-amber-700">Rs {(summary.totalPending || 0).toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-amber-600/80">Outstanding</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <p className="text-3xl font-extrabold text-slate-900">Rs {(summary.totalRevenue || 0).toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Total Revenue</p>
            </div>
          </div>

          {/* Monthly table */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">Monthly Breakdown</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {monthly.length > 0 ? (
                [...monthly].reverse().map((m, i) => {
                  const total = m.collected + m.pending;
                  const pct = total > 0 ? Math.round((m.collected / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Calendar className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{m.label}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">Rs {m.collected.toLocaleString()}</p>
                        {m.pending > 0 && (
                          <p className="text-[11px] text-amber-500">+ Rs {m.pending.toLocaleString()} pending</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">No data for this period</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Renewals Tab ── */}
      {tab === "renewals" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={CheckCircle2}
              label="Renewed"
              value={summary.paidCount || 0}
              color="emerald"
            />
            <StatCard
              icon={Clock}
              label="Pending Renewal"
              value={summary.pendingCount || 0}
              sub={summary.overdueCount > 0 ? `${summary.overdueCount} overdue` : undefined}
              color="amber"
            />
          </div>

          {/* Recent renewals list */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Renewals</h3>
              <p className="mt-0.5 text-xs text-slate-400">Last 20 paid renewals</p>
            </div>
            <div className="divide-y divide-slate-100">
              {renewals.length > 0 ? (
                renewals.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{r.studentName}</p>
                      <p className="text-xs text-slate-400">
                        Seat {r.seatNumber} · {r.month}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">Rs {r.amount?.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">{timeAgo(r.paidAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">No renewals found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
