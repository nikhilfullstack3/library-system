import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

const SHIFT_END_WARNING_MS = 30 * 60 * 1000;

function getAttendanceDisplay(student: any) {
  if (!student?.currentlyInLibrary || !student?.activeSessionStartedAt) {
    return student?.shiftTiming || student?.shift || "-";
  }
  const elapsedMs = Math.max(0, Date.now() - new Date(student.activeSessionStartedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function getShiftEndDate(student: any) {
  if (!student?.shiftEndTime || student?.fullDay) return null;
  const match = String(student.shiftEndTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === "PM") hours += 12;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getShiftWarning(student: any) {
  if (!student?.currentlyInLibrary) return null;
  const shiftEndDate = getShiftEndDate(student);
  if (!shiftEndDate) return null;
  const remainingMs = shiftEndDate.getTime() - Date.now();
  if (remainingMs <= 0) return "Your shift has ended. Please check out now.";
  if (remainingMs > SHIFT_END_WARNING_MS) return null;
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Shift ends in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export function StudentHomeScreen() {
  const { refreshStudentData, requestSeatChange, session, studentData, subscribeToLibraryEvents } = useAuth();
  const insets = useSafeAreaInsets();
  const [, setTimerTick] = useState(0);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [seatNumberInput, setSeatNumberInput] = useState("");
  const [seatReason, setSeatReason] = useState("");
  const [seatSubmitting, setSeatSubmitting] = useState(false);
  const [seatError, setSeatError] = useState("");

  useEffect(() => {
    refreshStudentData().catch(() => {});
  }, [refreshStudentData]);

  useEffect(() => {
    const interval = setInterval(() => setTimerTick((v) => v + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!session?.studentId) return () => {};
    return subscribeToLibraryEvents({
      onSeatChangeResolved: async (payload: any) => {
        if (String(payload?.studentId) === String(session?.studentId)) {
          await refreshStudentData(session.studentId);
        }
      },
    });
  }, [refreshStudentData, session?.studentId, subscribeToLibraryEvents]);

  async function handleSeatChangeRequest() {
    if (!seatNumberInput.trim()) return;
    setSeatSubmitting(true);
    setSeatError("");
    try {
      await requestSeatChange(seatNumberInput.trim(), seatReason);
      setSeatModalOpen(false);
      setSeatNumberInput("");
      setSeatReason("");
      await refreshStudentData(session?.studentId);
      Alert.alert("Request submitted", "Waiting for librarian approval.");
    } catch (err: any) {
      setSeatError(err?.message || "Unable to submit request");
    } finally {
      setSeatSubmitting(false);
    }
  }

  const student = studentData?.student;
  const attendanceDisplay = getAttendanceDisplay(student);
  const shiftWarning = getShiftWarning(student);
  const isIn = Boolean(student?.currentlyInLibrary);
  const pendingRequest = studentData?.pendingSeatChangeRequest;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Shift warning */}
      {shiftWarning ? (
        <View style={styles.warningBanner}>
          <Ionicons color="#dc2626" name="warning-outline" size={16} />
          <Text style={styles.warningText}>{shiftWarning}</Text>
        </View>
      ) : null}

      {/* Seat change pending */}
      {pendingRequest ? (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingText}>
            <Text style={{ fontWeight: "700" }}>Seat change pending: </Text>
            You requested Seat {pendingRequest.requestedSeatNumber}. Awaiting approval.
          </Text>
        </View>
      ) : null}

      {/* Status card */}
      <View style={[styles.statusCard, isIn ? styles.statusCardIn : styles.statusCardOut]}>
        <View style={styles.statusCardInner}>
          <View>
            <Text style={styles.statusSmall}>{isIn ? "Currently Inside" : "Currently Outside"}</Text>
            <Text style={styles.statusTitle}>{isIn ? "Checked In" : "Checked Out"}</Text>
            {isIn ? (
              <Text style={styles.statusTimer}>{attendanceDisplay}</Text>
            ) : null}
          </View>
          <View style={styles.statusIcon}>
            <Ionicons color="rgba(255,255,255,0.9)" name="time-outline" size={28} />
          </View>
        </View>
      </View>

      {/* Check In / Out button */}
      <Pressable
        onPress={() => router.push("/student-attendance-scan" as never)}
        style={[styles.checkButton, isIn ? styles.checkButtonOut : styles.checkButtonIn]}
      >
        <Ionicons color="#fff" name={isIn ? "log-out-outline" : "log-in-outline"} size={20} />
        <Text style={styles.checkButtonText}>
          {isIn ? "Check Out — Scan QR" : "Check In — Scan QR"}
        </Text>
        <Ionicons color="rgba(255,255,255,0.7)" name="qr-code-outline" size={18} />
      </Pressable>

      {/* Info grid */}
      <View style={styles.grid}>
        <InfoCard
          icon="bed-outline"
          label="Seat Number"
          value={student?.seatNumber ? `Seat ${student.seatNumber}` : "Not assigned"}
          color="#059669"
        />
        <InfoCard
          icon="time-outline"
          label="Shift"
          value={student?.shiftTiming || student?.shift || "Full Day"}
          color="#0284c7"
        />
        <InfoCard
          icon="calendar-outline"
          label="Attendance"
          value={student?.totalAttendance != null ? `${student.totalAttendance} days` : "—"}
          color="#7c3aed"
        />
        <InfoCard
          icon="checkmark-circle-outline"
          label="Fee Status"
          value={student?.feeStatus || "—"}
          color={student?.feeStatus === "paid" ? "#059669" : "#d97706"}
        />
      </View>

      {/* Seat change request */}
      {student?.seatNumber ? (
        <Pressable
          onPress={() => { setSeatModalOpen(true); setSeatNumberInput(""); setSeatError(""); }}
          style={styles.seatChangeButton}
        >
          <Ionicons color={colors.primary} name="swap-horizontal-outline" size={18} />
          <Text style={styles.seatChangeText}>
            {pendingRequest ? "Seat Change Pending…" : "Request Seat Change"}
          </Text>
        </Pressable>
      ) : null}

      {/* Seat Change Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={seatModalOpen}
        onRequestClose={() => setSeatModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSeatModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons color="#fff" name="swap-horizontal-outline" size={22} />
              </View>
              <View>
                <Text style={styles.modalSmall}>Current seat</Text>
                <Text style={styles.modalTitle}>Seat {student?.seatNumber}</Text>
              </View>
              <Pressable onPress={() => setSeatModalOpen(false)} style={styles.modalClose}>
                <Ionicons color="#fff" name="close" size={20} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>New seat number</Text>
              <TextInput
                keyboardType="numeric"
                autoFocus
                placeholder="Enter seat number"
                placeholderTextColor="#94a3b8"
                style={styles.fieldInput}
                value={seatNumberInput}
                onChangeText={(t) => { setSeatNumberInput(t); setSeatError(""); }}
              />

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Reason <Text style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</Text></Text>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="e.g. better lighting, near window…"
                placeholderTextColor="#94a3b8"
                style={[styles.fieldInput, styles.fieldTextarea]}
                value={seatReason}
                onChangeText={setSeatReason}
              />

              {seatError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{seatError}</Text>
                </View>
              ) : null}

              <Pressable
                disabled={seatSubmitting || !seatNumberInput.trim()}
                onPress={handleSeatChangeRequest}
                style={[styles.submitButton, (seatSubmitting || !seatNumberInput.trim()) ? styles.submitButtonDisabled : null]}
              >
                {seatSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Submit Request</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function InfoCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: color + "20" }]}>
        <Ionicons color={color} name={icon as any} size={18} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
  },
  warningText: { color: "#dc2626", fontSize: 13, fontWeight: "600", flex: 1 },
  pendingBanner: {
    backgroundColor: "#fffbeb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 12,
  },
  pendingText: { color: "#92400e", fontSize: 13 },
  statusCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statusCardIn: { backgroundColor: "#059669" },
  statusCardOut: { backgroundColor: "#475569" },
  statusCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusSmall: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  statusTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 4 },
  statusTimer: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontFamily: "monospace", marginTop: 4 },
  statusIcon: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 16, padding: 10 },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  checkButtonIn: { backgroundColor: "#059669" },
  checkButtonOut: { backgroundColor: "#e11d48" },
  checkButtonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: "800" },
  seatChangeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary + "60",
    backgroundColor: "#fff",
    padding: 14,
  },
  seatChangeText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#059669",
    padding: 20,
  },
  modalHeaderIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 8,
  },
  modalClose: {
    marginLeft: "auto",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 6,
  },
  modalSmall: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  modalBody: { padding: 20, gap: 4 },
  fieldLabel: { color: "#475569", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0f172a",
    fontSize: 15,
  },
  fieldTextarea: { minHeight: 72, textAlignVertical: "top" },
  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 10, marginTop: 4 },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500" },
  submitButton: {
    backgroundColor: "#059669",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
