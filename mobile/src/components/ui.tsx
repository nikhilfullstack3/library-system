import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../theme/colors";

export function Screen({
  children,
  scroll = false,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) {
  const content = <View style={[styles.screen, !padded ? styles.screenUnpadded : null]}>{children}</View>;

  if (scroll) {
    return <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent}>{content}</ScrollView>;
  }

  return <View style={styles.root}>{content}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <View style={styles.headingWrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.heading}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" ? styles.buttonPrimary : variant === "secondary" ? styles.buttonSecondary : styles.buttonGhost,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "primary" ? styles.buttonTextPrimary : styles.buttonTextSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#8ea292"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export function LoadingView({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function MessageBubble({
  align = "left",
  meta,
  message,
}: {
  align?: "left" | "right";
  meta: string;
  message: string;
}) {
  return (
    <View style={[styles.messageRow, align === "right" ? styles.messageRowRight : null]}>
      <View style={[styles.messageBubble, align === "right" ? styles.messageBubbleOwn : null]}>
        <Text style={styles.messageMeta}>{meta}</Text>
        <Text style={[styles.messageText, align === "right" ? styles.messageTextOwn : null]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  screen: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  screenUnpadded: {
    padding: 0,
    gap: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#1c402a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  headingWrap: {
    gap: 6,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    borderRadius: 16,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.primarySoft,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  buttonTextPrimary: {
    color: "#fff",
  },
  buttonTextSecondary: {
    color: colors.text,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surfaceMuted,
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  messageRow: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  messageRowRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  messageBubbleOwn: {
    backgroundColor: "#dff2e5",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 8,
  },
  messageMeta: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: colors.text,
  },
});
