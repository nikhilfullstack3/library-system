import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { AppButton, Card, Field, Heading, Screen } from "../../src/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function StudentProfileScreen() {
  const { changeStudentPassword, logout, refreshStudentData, session, studentData } = useAuth();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshStudentData().catch(() => {});
  }, [refreshStudentData]);

  async function handlePasswordChange() {
    if (!password.trim()) {
      return;
    }

    setSaving(true);
    try {
      await changeStudentPassword(password.trim());
      setPassword("");
      Alert.alert("Updated", "Password changed successfully.");
    } catch (error: any) {
      Alert.alert("Unable to change password", error?.message || "Try again");
    } finally {
      setSaving(false);
    }
  }

  const student = studentData?.student;

  return (
    <Screen scroll>
      <Heading
        eyebrow="Student Profile"
        title={student?.library?.name || "Library"}
        subtitle={`${student?.name || session?.name} • ${student?.email || session?.email}`}
      />

      <Card>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <ProfileRow label="Seat" value={student?.seatNumber || "-"} />
        <ProfileRow label="Phone" value={student?.phone || "-"} />
        <ProfileRow label="Shift" value={student?.shift || "-"} />
        <ProfileRow label="Shift Timing" value={student?.shiftTiming || "-"} />
        <ProfileRow label="Login ID" value={student?.loginId || "-"} />
        <ProfileRow label="Current Password" value={student?.issuedPassword || "Issued after payment"} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Transactions</Text>
        {(studentData?.payments || []).map((payment: any) => (
          <View key={payment.id} style={styles.transactionRow}>
            <View>
              <Text style={styles.transactionMonth}>{payment.month}</Text>
              <Text style={styles.transactionMeta}>Seat {payment.seat}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.transactionAmount}>Rs {payment.amount}</Text>
              <Text style={styles.transactionMeta}>{payment.status}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <Field
          label="New Password"
          onChangeText={setPassword}
          placeholder="Enter new password"
          secureTextEntry
          value={password}
        />
        <AppButton label={saving ? "Updating..." : "Update Password"} onPress={handlePasswordChange} />
      </Card>

      <AppButton label="Logout" onPress={() => logout()} variant="secondary" />
    </Screen>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profileLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  profileValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  transactionMonth: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  transactionAmount: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  transactionMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textTransform: "capitalize",
  },
});
