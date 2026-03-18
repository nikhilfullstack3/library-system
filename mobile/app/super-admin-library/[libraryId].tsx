import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Heading, LoadingView, Screen, StatCard } from "../../src/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function SuperAdminLibraryScreen() {
  const { booting, fetchSuperAdminLibrary, session } = useAuth();
  const { libraryId } = useLocalSearchParams<{ libraryId: string }>();
  const [libraryView, setLibraryView] = useState<any>(null);

  useEffect(() => {
    if (!libraryId) {
      return;
    }

    fetchSuperAdminLibrary(libraryId).then(setLibraryView).catch(() => {});
  }, [fetchSuperAdminLibrary, libraryId]);

  if (booting) {
    return <LoadingView label="Opening library view..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role !== "super_admin") {
    return <Redirect href={session.role === "student" ? "/student-chat" : "/(librarian)/dashboard"} />;
  }

  const stats = [
    { label: "Students", value: String(libraryView?.stats?.totalStudents || 0) },
    { label: "Revenue", value: `Rs ${libraryView?.stats?.totalRevenue || 0}` },
    { label: "Pending", value: String(libraryView?.stats?.pendingPayments || 0) },
    { label: "Librarians", value: String(libraryView?.stats?.totalLibrarians || 0) },
  ];

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons color={colors.primary} name="arrow-back" size={18} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Heading
        eyebrow="Library Detail"
        title={libraryView?.library?.name || "Loading library..."}
        subtitle={`${libraryView?.library?.location || "Unspecified"} · ${libraryView?.library?.contactEmail || ""}`}
      />

      <View style={styles.grid}>
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Students</Text>
        <View style={styles.stack}>
          {(libraryView?.students || []).map((student: any) => (
            <View key={student.id} style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{student.name}</Text>
                <Text style={styles.rowMeta}>Seat {student.seatNumber || "-"} · {student.shiftTiming || student.shift || "-"}</Text>
              </View>
              <Text style={styles.statusText}>{student.paymentStatus}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Librarians</Text>
        <View style={styles.stack}>
          {(libraryView?.librarians || []).map((librarian: any) => (
            <View key={librarian.id} style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{librarian.name}</Text>
                <Text style={styles.rowMeta}>{librarian.email}</Text>
              </View>
              <Text style={styles.statusText}>{librarian.role}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backText: {
    color: colors.primary,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  stack: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 14,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  statusText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
