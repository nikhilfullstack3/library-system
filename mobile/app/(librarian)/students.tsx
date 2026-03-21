import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card, Heading, Screen } from "../../src/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

const SHIFT_END_WARNING_MS = 30 * 60 * 1000;

function getShiftEndDate(student: any) {
  if (!student.shiftEndTime || student.fullDay) {
    return null;
  }

  const match = String(student.shiftEndTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === "PM") {
    hours += 12;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getLiveTimer(student: any) {
  if (student.fullDay || !student.currentlyInLibrary || !student.activeSessionStartedAt) {
    return null;
  }

  const elapsedMs = Math.max(0, Date.now() - new Date(student.activeSessionStartedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function getShiftWarning(student: any) {
  if (!student.currentlyInLibrary) {
    return null;
  }

  const shiftEndDate = getShiftEndDate(student);
  if (!shiftEndDate) {
    return null;
  }

  const remainingMs = shiftEndDate.getTime() - Date.now();
  if (remainingMs <= 0) {
    return "Shift ended";
  }

  if (remainingMs > SHIFT_END_WARNING_MS) {
    return null;
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Ends in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export default function LibrarianStudentsScreen() {
  const { fetchStudents } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchStudents({ page: 1, limit: 40 })
      .then((data) => setStudents(data.items || []))
      .catch(() => {});
  }, [fetchStudents]);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Screen scroll>
      <Heading
        eyebrow="Students"
        title="Manage Library Students"
        subtitle="View seats, payment status, credentials, and shift timing from mobile."
      />

      {students.map((student: any) => {
        const liveTimer = getLiveTimer(student);
        const shiftWarning = getShiftWarning(student);

        return (
        <Pressable
          key={student.id}
          onPress={() => router.push(`/(librarian)/student/${student.id}` as never)}
        >
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{student.name}</Text>
              <Text style={styles.meta}>
                Seat {student.seatNumber} • {student.phone}
              </Text>
            </View>
            <View style={[styles.badge, student.paymentStatus === "paid" ? styles.badgePaid : styles.badgePending]}>
              <Text style={[styles.badgeText, student.paymentStatus === "paid" ? styles.badgeTextPaid : styles.badgeTextPending]}>
                {student.paymentStatus}
              </Text>
            </View>
          </View>
          <Text style={[styles.detail, shiftWarning ? styles.detailWarning : null]}>
            {student.currentlyInLibrary ? "Live Timer" : "Shift Timing"}: {liveTimer || student.shiftTiming || student.shift || "-"}
          </Text>
          {shiftWarning ? <Text style={styles.warningText}>{shiftWarning}</Text> : null}
          <Text style={styles.detail}>Login ID: {student.loginId || "-"}</Text>
          <Text style={styles.detail}>Password: {student.issuedPassword || "Issued after payment"}</Text>
        </Card>
        </Pressable>
      )})}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 13,
  },
  detail: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  detailWarning: {
    color: "#c2410c",
    fontWeight: "700",
  },
  warningText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgePaid: {
    backgroundColor: "#ddf3e3",
  },
  badgePending: {
    backgroundColor: "#f8ead2",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  badgeTextPaid: {
    color: colors.success,
  },
  badgeTextPending: {
    color: colors.warning,
  },
});
