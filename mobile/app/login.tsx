import { Redirect } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton, Card, Field, Heading, Screen } from "../src/components/ui";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function LoginScreen() {
  const { authError, booting, login, session, setAuthError } = useAuth();
  const [role, setRole] = useState<"librarian" | "student" | "super_admin">("librarian");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!booting && session) {
    return <Redirect href={session.role === "student" ? "/(student)" : session.role === "super_admin" ? "/super-admin" : "/(librarian)/dashboard"} />;
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Enter your login ID/email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(role, email.trim(), password);
    } catch (error: any) {
      const message = error?.message || "Unable to login";
      setAuthError(message);
      Alert.alert("Login failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.wrap}>
          <Card style={styles.hero}>
            <Heading
              eyebrow="Library Study Room"
              title="Mobile App"
              subtitle="Students get chat and profile access. Librarians get dashboard, students, payments, and chat on mobile."
            />
          </Card>

          <Card>
            <View style={styles.roleRow}>
              <RoleButton active={role === "librarian"} label="Librarian" onPress={() => setRole("librarian")} />
              <RoleButton active={role === "student"} label="Student" onPress={() => setRole("student")} />
              <RoleButton active={role === "super_admin"} label="Super Admin" onPress={() => setRole("super_admin")} />
            </View>

            <Field
              autoCapitalize="none"
              label={role === "student" ? "Email or Login ID" : "Email"}
              onChangeText={setEmail}
              placeholder={role === "student" ? "student@library.com" : role === "super_admin" ? "superadmin@library.com" : "admin@library.com"}
              value={email}
            />
            <View style={styles.passwordWrap}>
              <Field
                label="Password"
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                value={password}
              />
              <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.showPasswordButton}>
                <Text style={styles.showPasswordText}>{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <AppButton label={submitting ? "Signing in..." : "Login"} onPress={handleLogin} />

            <View style={styles.demoBlock}>
              <Text style={styles.demoLabel}>Demo</Text>
              <Text style={styles.demoText}>Admin: `admin@library.com` / `admin123`</Text>
              <Text style={styles.demoText}>Super Admin: `superadmin@library.com` / `super123`</Text>
              <Text style={styles.demoText}>Student: `student@library.com` / `student123`</Text>
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function RoleButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return <AppButton label={label} onPress={onPress} variant={active ? "primary" : "secondary"} />;
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingTop: 28,
  },
  hero: {
    backgroundColor: "#f6fbf7",
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  passwordWrap: {
    position: "relative",
  },
  showPasswordButton: {
    position: "absolute",
    right: 14,
    top: 36,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  showPasswordText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    marginTop: 2,
    marginBottom: 10,
    fontSize: 13,
  },
  demoBlock: {
    marginTop: 14,
    gap: 4,
  },
  demoLabel: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  demoText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
