import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function SeatsTab() {
  const { assignSeat, libraryData } = useAuth();
  const insets = useSafeAreaInsets();
  const seats: any[] = libraryData?.seats || [];

  const [filter, setFilter] = useState<"all" | "occupied" | "empty">("all");
  const [search, setSearch] = useState("");
  const [activeSeat, setActiveSeat] = useState<any>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [seatError, setSeatError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredSeats = useMemo(() => {
    return seats.filter((seat) => {
      if (filter === "occupied" && seat.status !== "occupied") return false;
      if (filter === "empty" && seat.status === "occupied") return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const hay = `${seat.label} ${seat.number} ${seat.student?.name || ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [seats, filter, search]);

  const occupiedCount = seats.filter((s) => s.status === "occupied").length;
  const emptyCount = seats.length - occupiedCount;

  function openSeat(seat: any) {
    setActiveSeat(seat);
    setPhoneInput("");
    setSeatError("");
  }

  function closeSeat() {
    setActiveSeat(null);
    setPhoneInput("");
    setSeatError("");
    setSubmitting(false);
  }

  async function handleAssign(phone: string) {
    if (!activeSeat) return;
    setSubmitting(true);
    setSeatError("");
    try {
      await assignSeat(activeSeat.id, phone);
      closeSeat();
    } catch (err: any) {
      setSeatError(err?.message || "Unable to update seat");
      setSubmitting(false);
    }
  }

  const isOccupied = activeSeat?.status === "occupied";

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Stats + filter bar */}
      <View style={styles.header}>
        <View style={styles.statsRow}>
          <StatChip label="Total" value={seats.length} color="#64748b" bg="#f1f5f9" />
          <StatChip label="Occupied" value={occupiedCount} color="#e11d48" bg="#fff1f2" />
          <StatChip label="Empty" value={emptyCount} color="#059669" bg="#ecfdf5" />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons color="#94a3b8" name="search-outline" size={16} />
          <TextInput
            placeholder="Search seat or student…"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons color="#94a3b8" name="close-circle" size={16} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {(["all", "occupied", "empty"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Seat grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {filteredSeats.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons color="#cbd5e1" name="grid-outline" size={40} />
            <Text style={styles.emptyText}>No seats match your filter</Text>
          </View>
        ) : (
          filteredSeats.map((seat) => {
            const occupied = seat.status === "occupied";
            return (
              <Pressable
                key={seat.id}
                onPress={() => openSeat(seat)}
                style={[styles.card, occupied ? styles.cardOccupied : styles.cardEmpty]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.cardIcon, { backgroundColor: occupied ? "#fce7f3" : "#d1fae5" }]}>
                    <Ionicons color={occupied ? "#e11d48" : "#059669"} name="bed-outline" size={18} />
                  </View>
                  <View style={[styles.badge, { backgroundColor: occupied ? "#ffe4e6" : "#d1fae5" }]}>
                    <Text style={[styles.badgeText, { color: occupied ? "#e11d48" : "#059669" }]}>
                      {occupied ? "Occupied" : "Empty"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.seatLabel}>{seat.label}</Text>
                <Text style={styles.seatSub} numberOfLines={1}>
                  {occupied ? seat.student?.name || "Unknown" : "Available"}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Modal */}
      <Modal animationType="slide" transparent visible={!!activeSeat} onRequestClose={closeSeat}>
        <Pressable style={styles.overlay} onPress={closeSeat}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={[styles.sheetHeader, { backgroundColor: isOccupied ? "#e11d48" : "#059669" }]}>
              <View style={styles.sheetHeaderIcon}>
                <Ionicons color="#fff" name="bed-outline" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetSub}>{isOccupied ? "Occupied" : "Empty"}</Text>
                <Text style={styles.sheetTitle}>{activeSeat?.label}</Text>
              </View>
              <Pressable onPress={closeSeat} style={styles.sheetClose}>
                <Ionicons color="#fff" name="close" size={20} />
              </Pressable>
            </View>

            {isOccupied && activeSeat?.student?.name ? (
              <View style={styles.currentStudent}>
                <Text style={styles.currentLabel}>Currently assigned to</Text>
                <Text style={styles.currentName}>{activeSeat.student.name}</Text>
              </View>
            ) : null}

            <View style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>
                {isOccupied ? "Reassign to student" : "Assign to student"}
              </Text>
              <View style={styles.phoneRow}>
                <Ionicons color="#94a3b8" name="call-outline" size={16} />
                <TextInput
                  autoFocus
                  keyboardType="phone-pad"
                  placeholder="Student phone number"
                  placeholderTextColor="#94a3b8"
                  style={styles.phoneInput}
                  value={phoneInput}
                  onChangeText={(t) => { setPhoneInput(t); setSeatError(""); }}
                />
              </View>
              <Text style={styles.hint}>Enter the student's registered phone number</Text>

              {seatError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{seatError}</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  disabled={submitting || !phoneInput.trim()}
                  onPress={() => handleAssign(phoneInput.trim())}
                  style={[
                    styles.assignBtn,
                    { backgroundColor: isOccupied ? "#e11d48" : "#059669" },
                    (submitting || !phoneInput.trim()) && styles.btnDisabled,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.assignBtnText}>
                      {isOccupied ? "Reassign Seat" : "Assign Seat"}
                    </Text>
                  )}
                </Pressable>

                {isOccupied ? (
                  <Pressable
                    disabled={submitting}
                    onPress={() => handleAssign("")}
                    style={[styles.clearBtn, submitting && styles.btnDisabled]}
                  >
                    <Ionicons color="#e11d48" name="trash-outline" size={18} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function StatChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: "#fff", padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  statsRow: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  chipLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  chipValue: { fontSize: 18, fontWeight: "800" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 14, backgroundColor: "#f8fafc", paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterPill: { flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", paddingVertical: 8, backgroundColor: "#f8fafc" },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  filterTextActive: { color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 10 },
  empty: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { color: "#94a3b8", fontSize: 14 },
  card: { width: "47%", borderRadius: 18, padding: 14, borderWidth: 1.5, gap: 6 },
  cardOccupied: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  cardEmpty: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  seatLabel: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  seatSub: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20 },
  sheetHeaderIcon: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 8 },
  sheetSub: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  sheetTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sheetClose: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 6 },
  currentStudent: { backgroundColor: "#fff7ed", borderBottomWidth: 1, borderBottomColor: "#fed7aa", padding: 16 },
  currentLabel: { color: "#92400e", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  currentName: { color: "#78350f", fontSize: 15, fontWeight: "800", marginTop: 2 },
  sheetBody: { padding: 20, gap: 8 },
  fieldLabel: { color: "#475569", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 14, backgroundColor: "#f8fafc", paddingHorizontal: 14, paddingVertical: 12 },
  phoneInput: { flex: 1, fontSize: 15, color: "#0f172a" },
  hint: { color: "#94a3b8", fontSize: 12 },
  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 10 },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500" },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  assignBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: "center" },
  assignBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  clearBtn: { borderRadius: 14, borderWidth: 1.5, borderColor: "#fecdd3", backgroundColor: "#fff1f2", padding: 16, alignItems: "center", justifyContent: "center" },
  btnDisabled: { opacity: 0.5 },
});
