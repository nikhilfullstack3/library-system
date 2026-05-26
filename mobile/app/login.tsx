import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";

const C = {
  bg: "#f0fdf4",
  surface: "#ffffff",
  border: "#d1fae5",
  primary: "#10b981",
  primaryDark: "#059669",
  activeTabText: "#047857",
  tabBg: "#f1f5f9",
  amber: "#fbbf24",
  text: "#0f172a",
  textMuted: "#64748b",
  textLabel: "#475569",
  placeholder: "#94a3b8",
  inputBorder: "#e2e8f0",
  errorBg: "#fff1f2",
  errorBorder: "#fecdd3",
  errorText: "#be123c",
};

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
      setAuthError("Enter your login ID/email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(role, email.trim(), password);
    } catch (error: any) {
      setAuthError(error?.message || "Sign-in could not be completed right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Brand mark */}
            <View style={styles.brandMarkWrap}>
              <View style={styles.brandMark}>
                <Ionicons name="library" size={28} color="#fff" />
              </View>
              <View style={styles.sparkleBadge}>
                <Ionicons name="sparkles" size={10} color="#fff" />
              </View>
            </View>

            {/* Title */}
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Welcome to LibHook</Text>
              <Text style={styles.subtitle}>Sign in to access your library workspace.</Text>
            </View>

            {/* Role tabs */}
            <View style={styles.tabContainer}>
              {(["librarian", "student"] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => { setRole(r); setAuthError(""); }}
                  style={[styles.tab, role === r && styles.tabActive]}
                >
                  <Text style={[styles.tabText, role === r && styles.tabTextActive]}>
                    {r === "librarian" ? "Librarian" : "Student"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                {role === "student" ? "Email or Login ID" : "Email"}
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder={role === "student" ? "Student email or login ID" : "admin@library.com"}
                placeholderTextColor={C.placeholder}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={C.placeholder}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={C.placeholder}
                  />
                </Pressable>
              </View>
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleLogin}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && !submitting && styles.submitBtnPressed,
                submitting && styles.submitBtnDisabled,
              ]}
            >
              <Text style={styles.submitText}>
                {submitting
                  ? "Signing in..."
                  : `Sign in as ${role === "student" ? "Student" : "Librarian"}`}
              </Text>
              {!submitting && (
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              )}
            </Pressable>

            {/* Error */}
            {authError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            {/* Terms */}
            <Text style={styles.terms}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>Terms &amp; Conditions</Text>
              {" "}and our{" "}
              <Text style={styles.termsLink} onPress={() => router.push("/child-safety")}>
                Child Safety Policy
              </Text>
            </Text>

            {/* Register */}
            <Text style={styles.terms}>
              Need a new library workspace?{" "}
              <Text style={styles.termsLink} onPress={() => router.push("/register-library") }>
                Create your account
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#ffffff99",
    padding: 28,
    gap: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 8,
  },
  brandMarkWrap: {
    alignSelf: "center",
    width: 64,
    height: 64,
    marginBottom: 4,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  sparkleBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.surface,
  },
  titleWrap: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: C.tabBg,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: C.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: -0.2,
  },
  tabTextActive: {
    color: C.activeTabText,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textLabel,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  input: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.inputBorder,
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 16,
    fontSize: 15,
    color: C.text,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  submitBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: C.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  errorBox: {
    backgroundColor: C.errorBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.errorBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: C.errorText,
    fontSize: 13,
    fontWeight: "500",
  },
  terms: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  termsLink: {
    color: C.primaryDark,
    fontWeight: "600",
  },
});
