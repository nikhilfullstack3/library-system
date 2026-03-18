import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton, Card, Heading, Screen, StatCard } from "../../src/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function LibrarianDashboardScreen() {
  const { libraryData, logout, refreshLibraryData, session } = useAuth();

  useEffect(() => {
    refreshLibraryData().catch(() => {});
  }, [refreshLibraryData]);

  const stats = [
    { label: "Total Students", value: String(libraryData?.stats?.totalStudents || 0) },
    { label: "Occupied Seats", value: String(libraryData?.stats?.occupiedSeats || 0) },
    { label: "Empty Seats", value: String(libraryData?.stats?.emptySeats || 0) },
    { label: "Today's Attendance", value: String(libraryData?.stats?.todaysAttendance || 0) },
  ];

  return (
    <Screen scroll>
      <Heading
        eyebrow={session?.role === "admin" ? "Admin Dashboard" : "Librarian Dashboard"}
        title={libraryData?.library?.name || "Library"}
        subtitle={`Welcome, ${session?.name}`}
      />

      <View style={styles.grid}>
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Today</Text>
        <Text style={styles.sectionText}>
          Pending payments: {libraryData?.stats?.pendingPayments || 0}
        </Text>
        <Text style={styles.sectionText}>
          Document reviews: {libraryData?.stats?.pendingDocuments || 0}
        </Text>
        <Text style={styles.sectionText}>Open seats: {libraryData?.stats?.emptySeats || 0}</Text>
      </Card>

      <AppButton label="Logout" onPress={() => logout()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  sectionText: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
});
