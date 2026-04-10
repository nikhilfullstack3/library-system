import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

const PERIODS = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

const TABS = [
  { id: "overview", label: "Overview", icon: "stats-chart-outline" as const },
  { id: "revenue", label: "Revenue", icon: "cash-outline" as const },
  { id: "renewals", label: "Renewals", icon: "refresh-outline" as const },
];

function formatRupees(amount: number) {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return String(amount);
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "emerald",
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: "emerald" | "amber" | "rose" | "sky";
}) {
  const iconColor = {
    emerald: colors.primary,
    amber: "#b45309",
    rose: "#dc2626",
    sky: "#0369a1",
  }[color];

  const bgColor = {
    emerald: colors.primarySoft,
    amber: "#fef3c7",
    rose: "#fee2e2",
    sky: "#e0f2fe",
  }[color];

  return (
    <View style={[styles.statCard]}>
      <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function MiniBarChart({ data }: { data: any[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.collected || 0, d.pending || 0)), 1);
  const BAR_MAX = 80;

  return (
    <View style={styles.chartWrap}>
      {data.map((item, i) => {
        const collectedH = Math.max(((item.collected || 0) / maxVal) * BAR_MAX, item.collected > 0 ? 3 : 0);
        const pendingH = Math.max(((item.pending || 0) / maxVal) * BAR_MAX, item.pending > 0 ? 3 : 0);
        return (
          <View key={i} style={styles.chartCol}>
            <Text style={styles.chartValLabel}>
              {item.collected > 0 ? `${((item.collected) / 1000).toFixed(0)}k` : ""}
            </Text>
            <View style={styles.chartBars}>
              <View style={[styles.barCollected, { height: collectedH }]} />
              <View style={[styles.barPending, { height: pendingH }]} />
            </View>
            <Text style={styles.chartMonthLabel} numberOfLines={1}>
              {item.label?.split(" ")[0]?.slice(0, 3)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CollectionRing({ rate }: { rate: number }) {
  const ringColor = rate >= 70 ? colors.primary : rate >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringOuter, { borderColor: "#e2e8f0" }]}>
        <View style={[styles.ringInner, { borderColor: ringColor }]}>
          <Text style={[styles.ringRate, { color: ringColor }]}>{rate}%</Text>
          <Text style={styles.ringLabel}>collected</Text>
        </View>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { fetchAnalytics, seedAnalyticsDemo, session } = useAuth();
  const [period, setPeriod] = useState("6m");
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  const isAdmin = session?.role === "admin" || session?.role === "super_admin";

  const load = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const result = await fetchAnalytics(period);
        setData(result);
      } catch {}
      finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchAnalytics, period]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(false);
  }, [load]);

  async function handleSeedDemo() {
    setSeedError("");
    setSeeding(true);
    try {
      await seedAnalyticsDemo();
      const result = await fetchAnalytics(period);
      setData(result);
    } catch (err: any) {
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Period filters */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => setPeriod(p.value)}
            style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, period === p.value && styles.periodBtnTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
        {isAdmin && (
          <Pressable
            onPress={handleSeedDemo}
            disabled={seeding}
            style={[styles.seedBtn, seeding && { opacity: 0.6 }]}
          >
            {seeding ? (
              <ActivityIndicator size="small" color="#7c3aed" />
            ) : (
              <Ionicons name="flask-outline" size={15} color="#7c3aed" />
            )}
          </Pressable>
        )}
      </View>
      {seedError ? <Text style={styles.seedError}>{seedError}</Text> : null}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
          >
            <Ionicons
              name={t.icon}
              size={14}
              color={tab === t.id ? "#fff" : colors.textMuted}
            />
            <Text style={[styles.tabBtnText, tab === t.id && styles.tabBtnTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 8 }} />}

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <View style={styles.section}>
          <View style={styles.statGrid}>
            <StatCard
              icon="cash-outline"
              label="Collected"
              value={`Rs ${formatRupees(summary.totalCollected || 0)}`}
              sub={monthlyTrend !== undefined ? `${monthlyTrend >= 0 ? "+" : ""}${monthlyTrend}% vs last month` : undefined}
              color="emerald"
            />
            <StatCard
              icon="time-outline"
              label="Pending"
              value={`Rs ${formatRupees(summary.totalPending || 0)}`}
              sub={`${summary.pendingCount || 0} payments`}
              color="amber"
            />
            <StatCard
              icon="people-outline"
              label="Avg/Student"
              value={`Rs ${formatRupees(summary.avgPerStudent || 0)}`}
              color="sky"
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="Collection Rate"
              value={`${summary.collectionRate || 0}%`}
              sub={`${summary.paidCount || 0} of ${(summary.paidCount || 0) + (summary.pendingCount || 0)}`}
              color={summary.collectionRate >= 70 ? "emerald" : "rose"}
            />
          </View>

          {/* Bar Chart */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Monthly Revenue</Text>
              <View style={styles.legend}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Collected</Text>
                <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
                <Text style={styles.legendText}>Pending</Text>
              </View>
            </View>
            {monthly.length > 0 ? (
              <MiniBarChart data={monthly} />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>No payment data for this period</Text>
                {isAdmin && (
                  <Pressable onPress={handleSeedDemo} disabled={seeding} style={styles.seedInlineBtn}>
                    <Ionicons name="flask-outline" size={13} color="#7c3aed" />
                    <Text style={styles.seedInlineBtnText}>Load Demo Data</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Collection Ring */}
          <View style={[styles.card, styles.ringCard]}>
            <CollectionRing rate={summary.collectionRate || 0} />
            <View style={styles.ringStats}>
              <View style={styles.ringStatRow}>
                <View style={[styles.ringStatDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.ringStatLabel}>Paid</Text>
                <Text style={[styles.ringStatVal, { color: colors.primary }]}>{summary.paidCount || 0}</Text>
              </View>
              <View style={styles.ringStatRow}>
                <View style={[styles.ringStatDot, { backgroundColor: "#f59e0b" }]} />
                <Text style={styles.ringStatLabel}>Pending</Text>
                <Text style={[styles.ringStatVal, { color: "#b45309" }]}>{summary.pendingCount || 0}</Text>
              </View>
              <View style={styles.ringStatRow}>
                <View style={[styles.ringStatDot, { backgroundColor: "#ef4444" }]} />
                <Text style={styles.ringStatLabel}>Overdue</Text>
                <Text style={[styles.ringStatVal, { color: "#dc2626" }]}>{summary.overdueCount || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── Revenue Tab ── */}
      {tab === "revenue" && (
        <View style={styles.section}>
          <View style={styles.revenueSummaryRow}>
            <View style={[styles.revenueSummaryCard, { borderColor: "#6ee7b7", backgroundColor: "#ecfdf5" }]}>
              <Text style={[styles.revenueBig, { color: colors.primary }]}>
                Rs {(summary.totalCollected || 0).toLocaleString()}
              </Text>
              <Text style={[styles.revenueCaption, { color: colors.primary }]}>Collected</Text>
            </View>
            <View style={[styles.revenueSummaryCard, { borderColor: "#fde68a", backgroundColor: "#fefce8" }]}>
              <Text style={[styles.revenueBig, { color: "#b45309" }]}>
                Rs {(summary.totalPending || 0).toLocaleString()}
              </Text>
              <Text style={[styles.revenueCaption, { color: "#b45309" }]}>Outstanding</Text>
            </View>
          </View>
          <View style={[styles.revenueSummaryCard, styles.revenueTotalCard]}>
            <Text style={styles.revenueTotalVal}>Rs {(summary.totalRevenue || 0).toLocaleString()}</Text>
            <Text style={styles.revenueTotalCaption}>Total Revenue</Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Monthly Breakdown</Text>
            {monthly.length > 0 ? (
              [...monthly].reverse().map((m: any, i: number) => {
                const total = m.collected + m.pending;
                const pct = total > 0 ? Math.round((m.collected / total) * 100) : 0;
                return (
                  <View key={i} style={styles.monthRow}>
                    <View style={styles.monthIcon}>
                      <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.monthLabel}>{m.label}</Text>
                      <View style={styles.progressRow}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
                        </View>
                        <Text style={styles.progressPct}>{pct}%</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.monthCollected}>Rs {m.collected.toLocaleString()}</Text>
                      {m.pending > 0 && (
                        <Text style={styles.monthPending}>+Rs {m.pending.toLocaleString()}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No data for this period</Text>
            )}
          </View>
        </View>
      )}

      {/* ── Renewals Tab ── */}
      {tab === "renewals" && (
        <View style={styles.section}>
          <View style={styles.statGrid}>
            <StatCard
              icon="checkmark-circle-outline"
              label="Renewed"
              value={summary.paidCount || 0}
              color="emerald"
            />
            <StatCard
              icon="time-outline"
              label="Pending Renewal"
              value={summary.pendingCount || 0}
              sub={summary.overdueCount > 0 ? `${summary.overdueCount} overdue` : undefined}
              color="amber"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Renewals</Text>
            <Text style={styles.cardSubtitle}>Last 20 paid renewals</Text>
            {renewals.length > 0 ? (
              renewals.map((r: any) => (
                <View key={r.id} style={styles.renewalRow}>
                  <View style={styles.renewalIcon}>
                    <Ionicons name="trending-up-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.renewalName}>{r.studentName}</Text>
                    <Text style={styles.renewalMeta}>Seat {r.seatNumber} · {r.month}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.renewalAmount}>Rs {r.amount?.toLocaleString()}</Text>
                    <Text style={styles.renewalTime}>{timeAgo(r.paidAt)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No renewals found</Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Period
  periodRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodBtnText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  periodBtnTextActive: { color: "#fff" },
  seedBtn: {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd6fe",
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  seedError: { fontSize: 11, color: "#dc2626", fontWeight: "600" },

  // Tabs
  tabRow: { flexDirection: "row", gap: 6 },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  tabBtnText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  tabBtnTextActive: { color: "#fff" },

  section: { gap: 12 },

  // Stat grid
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  statSub: { fontSize: 10, color: colors.textMuted },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  cardSubtitle: { fontSize: 11, color: colors.textMuted, marginBottom: 12 },

  // Legend
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 10, color: colors.textMuted, marginRight: 4 },

  // Bar chart
  chartWrap: { flexDirection: "row", alignItems: "flex-end", gap: 4, minHeight: 100, overflow: "hidden" },
  chartCol: { flex: 1, alignItems: "center", gap: 2 },
  chartBars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  barCollected: { width: 10, borderRadius: 3, backgroundColor: colors.primary },
  barPending: { width: 10, borderRadius: 3, backgroundColor: "#f59e0b" },
  chartValLabel: { fontSize: 8, color: colors.textMuted, fontWeight: "600" },
  chartMonthLabel: { fontSize: 9, color: colors.textMuted, fontWeight: "600" },

  // Ring
  ringCard: { flexDirection: "row", alignItems: "center", gap: 20 },
  ringWrap: { alignItems: "center" },
  ringOuter: { width: 100, height: 100, borderRadius: 50, borderWidth: 10, alignItems: "center", justifyContent: "center" },
  ringInner: { width: 76, height: 76, borderRadius: 38, borderWidth: 10, alignItems: "center", justifyContent: "center" },
  ringRate: { fontSize: 18, fontWeight: "800" },
  ringLabel: { fontSize: 9, color: colors.textMuted, fontWeight: "600" },
  ringStats: { flex: 1, gap: 8 },
  ringStatRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ringStatDot: { width: 8, height: 8, borderRadius: 4 },
  ringStatLabel: { flex: 1, fontSize: 12, color: colors.textMuted },
  ringStatVal: { fontSize: 14, fontWeight: "800" },

  // Revenue
  revenueSummaryRow: { flexDirection: "row", gap: 10 },
  revenueSummaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  revenueTotalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 0,
  },
  revenueBig: { fontSize: 18, fontWeight: "800" },
  revenueCaption: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  revenueTotalVal: { fontSize: 20, fontWeight: "800", color: colors.text },
  revenueTotalCaption: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },

  // Month rows
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 4 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.primary },
  progressPct: { fontSize: 10, fontWeight: "700", color: colors.textMuted },
  monthCollected: { fontSize: 13, fontWeight: "700", color: colors.primary },
  monthPending: { fontSize: 10, color: "#b45309" },

  // Renewals
  renewalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  renewalIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  renewalName: { fontSize: 13, fontWeight: "600", color: colors.text },
  renewalMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  renewalAmount: { fontSize: 13, fontWeight: "700", color: colors.primary },
  renewalTime: { fontSize: 10, color: colors.textMuted },

  // Empty
  emptyChart: { alignItems: "center", paddingVertical: 24, gap: 10 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 16 },
  seedInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#ddd6fe",
    backgroundColor: "#f5f3ff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  seedInlineBtnText: { fontSize: 12, fontWeight: "700", color: "#7c3aed" },
});
