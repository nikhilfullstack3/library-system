import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "../../src/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default function LibrarianDashboardScreen() {
  const {
    libraryData,
    refreshLibraryData,
    resolveSeatChangeRequest,
    session,
    subscribeToLibraryEvents,
  } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [newRequestIds, setNewRequestIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const age = Date.now() - (libraryData?._fetchedAt || 0);
    if (age > 60_000) {
      refreshLibraryData().catch(() => {});
    }
  }, [libraryData?._fetchedAt, refreshLibraryData]);

  useEffect(() => {
    return subscribeToLibraryEvents({
      onSeatChangeRequest: async (payload: any) => {
        setNewRequestIds((prev) => new Set([...prev, String(payload?.requestId)]));
        await refreshLibraryData();
      },
    });
  }, [refreshLibraryData, subscribeToLibraryEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLibraryData();
    } catch {}
    setRefreshing(false);
  }, [refreshLibraryData]);

  async function handleResolve(requestId: string, action: string) {
    setResolving(requestId);
    try {
      await resolveSeatChangeRequest(requestId, action);
      setNewRequestIds((prev) => {
        const n = new Set(prev);
        n.delete(requestId);
        return n;
      });
    } finally {
      setResolving(null);
    }
  }

  const stats = libraryData?.stats || {};
  const totalSeats =
    stats.totalSeats || (stats.occupiedSeats || 0) + (stats.emptySeats || 0) || 0;
  const occupancyPercent =
    totalSeats > 0 ? Math.round((stats.occupiedSeats / totalSeats) * 100) : 0;
  const recentActivity = libraryData?.recentActivity || [];
  const seatChangeRequests = libraryData?.seatChangeRequests || [];

  const attentionCount =
    seatChangeRequests.length +
    (stats.pendingPayments > 0 ? 1 : 0) +
    (stats.pendingDocuments > 0 ? 1 : 0);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {getGreeting()}, {session?.name?.split(" ")[0]}
          </Text>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>
        <View style={styles.libraryBadge}>
          <Text style={styles.libraryBadgeText}>
            {libraryData?.library?.name || "Library"}
          </Text>
        </View>
      </View>

      {/* ── Live Pulse ── */}
      <Pressable
        onPress={() => router.push("/(librarian)/seats" as never)}
        style={({ pressed }) => [styles.pulseCard, { cursor: "pointer" } as any, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.pulseHeader}>
          <View style={styles.pulseDotWrap}>
            <View style={styles.pulseDotOuter} />
            <View style={styles.pulseDotInner} />
          </View>
          <Text style={styles.pulseLabel}>LIVE NOW</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.primary}
            style={{ marginLeft: "auto" }}
          />
        </View>

        <View style={styles.pulseNumbers}>
          <View>
            <Text style={styles.pulseBig}>{stats.currentStudents || 0}</Text>
            <Text style={styles.pulseSub}>students inside</Text>
          </View>
          <View>
            <Text style={styles.pulseMedium}>
              {stats.occupiedSeats || 0}
              <Text style={styles.pulseMuted}>/{totalSeats}</Text>
            </Text>
            <Text style={styles.pulseSub}>seats filled</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(occupancyPercent, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.pulseFooter}>
          {occupancyPercent}% occupancy · {stats.emptySeats || 0} seats available
        </Text>
      </Pressable>

      {/* ── Needs Attention ── */}
      {attentionCount > 0 ? (
        <Card style={styles.attentionCard}>
          <View style={styles.attentionHeader}>
            <Text style={styles.attentionTitle}>Needs Your Attention</Text>
            <View style={styles.attentionBadge}>
              <Text style={styles.attentionBadgeText}>{attentionCount}</Text>
            </View>
          </View>

          {/* Pending Payments */}
          {stats.pendingPayments > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.attentionRow,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.push("/(librarian)/students" as never)}
            >
              <View style={styles.attentionIcon}>
                <Ionicons name="wallet-outline" size={16} color="#b45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attentionRowTitle}>
                  {stats.pendingPayments} pending payment
                  {stats.pendingPayments !== 1 ? "s" : ""}
                </Text>
                <Text style={styles.attentionRowSub}>
                  Students awaiting payment
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          )}

          {/* Pending Documents */}
          {stats.pendingDocuments > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.attentionRow,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.push("/(librarian)/students" as never)}
            >
              <View style={styles.attentionIcon}>
                <Ionicons name="document-text-outline" size={16} color="#b45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attentionRowTitle}>
                  {stats.pendingDocuments} document
                  {stats.pendingDocuments !== 1 ? "s" : ""} to verify
                </Text>
                <Text style={styles.attentionRowSub}>
                  Review uploaded documents
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          )}

          {/* Seat Change Requests — inline */}
          {seatChangeRequests.map((req: any) => {
            const isNew = newRequestIds.has(String(req.id));
            return (
              <View
                key={req.id}
                style={[
                  styles.attentionRow,
                  { flexDirection: "column", alignItems: "stretch" },
                  isNew && styles.attentionRowNew,
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={styles.attentionIcon}>
                    <Ionicons name="swap-horizontal-outline" size={16} color="#b45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.attentionRowTitle}>{req.studentName}</Text>
                      {isNew && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.attentionRowSub}>
                      Seat {req.currentSeatNumber || "—"} → Seat{" "}
                      {req.requestedSeatNumber}
                      {req.reason ? ` · "${req.reason}"` : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.resolveButtons}>
                  <Pressable
                    disabled={resolving === req.id}
                    onPress={() => handleResolve(req.id, "approve")}
                    style={({ pressed }) => [
                      styles.approveBtn,
                      pressed && { opacity: 0.8 },
                      resolving === req.id && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.approveBtnText}>
                      {resolving === req.id ? "…" : "Approve"}
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={resolving === req.id}
                    onPress={() => handleResolve(req.id, "reject")}
                    style={({ pressed }) => [
                      styles.rejectBtn,
                      pressed && { opacity: 0.8 },
                      resolving === req.id && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Card>
      ) : (
        <Card style={styles.allClearCard}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          <Text style={styles.allClearTitle}>All caught up!</Text>
          <Text style={styles.allClearSub}>
            Nothing needs your attention right now
          </Text>
        </Card>
      )}

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <Card style={styles.statTile}>
          <Text style={styles.statValue}>{stats.totalStudents || 0}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </Card>
        <Card style={styles.statTile}>
          <Text style={styles.statValue}>{stats.todaysAttendance || 0}</Text>
          <Text style={styles.statLabel}>Checked In Today</Text>
        </Card>
        <Card style={styles.statTile}>
          <Text style={styles.statValueGreen}>
            {stats.paidStudents || 0}
            <Text style={styles.statValueMuted}>/{stats.totalStudents || 0}</Text>
          </Text>
          <Text style={styles.statLabel}>Paid Up</Text>
        </Card>
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.actionRow}>
        {[
          { icon: "person-add-outline" as const, label: "Add Student", path: "/(librarian)/registration" },
          { icon: "people-outline" as const, label: "Students", path: "/(librarian)/students" },
          { icon: "grid-outline" as const, label: "Seats", path: "/(librarian)/seats" },
          { icon: "chatbubble-ellipses-outline" as const, label: "Chat", path: "/(librarian)/chat" },
        ].map((action) => (
          <Pressable
            key={action.label}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionPressed,
            ]}
            onPress={() => router.push(action.path as never)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Today's Activity ── */}
      <Card>
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        {recentActivity.length > 0 ? (
          recentActivity.map((item: any) => (
            <View key={item.id} style={styles.activityRow}>
              <View
                style={[
                  styles.activityDot,
                  {
                    backgroundColor: item.isActive
                      ? colors.success
                      : colors.border,
                  },
                ]}
              />
              <View style={styles.activityInfo}>
                <Text style={styles.activityName} numberOfLines={1}>
                  {item.studentName}
                </Text>
                <Text style={styles.activityMeta}>
                  Seat {item.seatNumber} ·{" "}
                  {item.isActive
                    ? `In since ${item.checkIn}`
                    : `${item.checkIn} — ${item.checkOut}`}
                </Text>
              </View>
              {item.isActive && (
                <View style={styles.inBadge}>
                  <Text style={styles.inBadgeText}>IN</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No check-ins yet today</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  greeting: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  libraryBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary + "30",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  libraryBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  // Live Pulse
  pulseCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary + "30",
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    shadowColor: "#1c402a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  pulseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  pulseDotWrap: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDotOuter: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success + "40",
  },
  pulseDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  pulseLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  pulseNumbers: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 28,
  },
  pulseBig: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "800",
  },
  pulseMedium: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  pulseMuted: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
  },
  pulseSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary + "25",
    overflow: "hidden",
    marginTop: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  pulseFooter: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
  },

  // Needs Attention
  attentionCard: {
    backgroundColor: "#fefce8",
    borderColor: "#fde68a",
    borderWidth: 1,
  },
  attentionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  attentionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  attentionBadge: {
    backgroundColor: "#f59e0b",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  attentionBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  attentionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 12,
    marginBottom: 8,
  },
  attentionRowNew: {
    borderColor: "#f59e0b",
    borderWidth: 2,
  },
  attentionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  attentionRowTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  attentionRowSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  newBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  newBadgeText: {
    color: "#b45309",
    fontSize: 9,
    fontWeight: "800",
  },
  resolveButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingLeft: 42,
  },
  approveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  approveBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  rejectBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  rejectBtnText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
  },

  // All clear
  allClearCard: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary + "30",
    borderWidth: 1,
    paddingVertical: 20,
  },
  allClearTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  allClearSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  statValueGreen: {
    color: colors.success,
    fontSize: 20,
    fontWeight: "800",
  },
  statValueMuted: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },

  // Quick Actions
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    gap: 6,
  },
  actionPressed: {
    opacity: 0.7,
    backgroundColor: colors.primarySoft,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "700",
  },

  // Activity
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityInfo: {
    flex: 1,
    gap: 1,
  },
  activityName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  activityMeta: {
    color: colors.textMuted,
    fontSize: 11,
  },
  inBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inBadgeText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
});
