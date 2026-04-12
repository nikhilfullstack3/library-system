import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton, Field } from "../src/components/ui";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function LoginScreen() {
  const { authError, booting, login, session, setAuthError } = useAuth();
  const [role, setRole] = useState<"librarian" | "student">("librarian");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!booting && session) {
    return (
      <Redirect
        href={
          session.role === "student"
            ? "/(student)"
            : session.role === "super_admin"
              ? "/super-admin"
              : "/(librarian)/dashboard"
        }
      />
    );
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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand card */}
          <View style={styles.brandCard}>
            <View style={styles.brandIcon}>
              <Ionicons color="#fff" name="library-outline" size={28} />
            </View>
            <Text style={styles.brandTitle}>Welcome back</Text>
            <Text style={styles.brandSub}>Sign in to continue to your dashboard</Text>
          </View>

          {/* Login card */}
          <View style={styles.card}>
            {/* Role tabs */}
            <View style={styles.roleRow}>
              <RoleButton active={role === "librarian"} label="Librarian" onPress={() => { setRole("librarian"); setAuthError(""); }} />
              <RoleButton active={role === "student"} label="Student" onPress={() => { setRole("student"); setAuthError(""); }} />
            </View>

            <Field
              autoCapitalize="none"
              label={role === "student" ? "Email or Login ID" : "Email"}
              onChangeText={setEmail}
              placeholder={role === "student" ? "student email or login ID" : "you@example.com"}
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
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
              >
                <Ionicons
                  color={colors.textMuted}
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                />
              </Pressable>
            </View>

            {authError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            <AppButton
              label={submitting ? "Signing in..." : `Sign in as ${role === "student" ? "Student" : "Librarian"}`}
              onPress={handleLogin}
            />

            <Text style={styles.terms}>
              By signing in you agree to our{" "}
              <Text style={styles.termsLink}>Terms &amp; Conditions</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  brandCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandSub: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  passwordWrap: {
    position: "relative",
    marginBottom: 4,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 36,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "500",
  },
  terms: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});
