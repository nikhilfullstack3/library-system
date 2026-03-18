import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { AppButton, Card, Field, Heading, Screen } from "../../src/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

const baseForm = {
  address: "",
  email: "",
  fullDay: false,
  name: "",
  password: "",
  paymentMode: "cash",
  phone: "",
  shiftEndTime: new Date(2026, 0, 1, 14, 0),
  shiftStartTime: new Date(2026, 0, 1, 8, 0),
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default function LibrarianRegistrationScreen() {
  const { createStudent } = useAuth();
  const [form, setForm] = useState(baseForm);
  const [documents, setDocuments] = useState<{ uri: string; name: string; mimeType?: string }[]>([]);
  const [showPicker, setShowPicker] = useState<"" | "start" | "end">("");
  const [submitting, setSubmitting] = useState(false);

  const pickedFiles = useMemo(() => documents.map((item) => item.name), [documents]);

  async function handlePickDocuments() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
    });

    if (result.canceled) {
      return;
    }

    setDocuments((current) => [
      ...current,
      ...result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || undefined,
      })),
    ]);
  }

  async function handleOpenCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to capture student documents.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    setDocuments((current) => [
      ...current,
      ...result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `camera-document-${Date.now()}-${index}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      })),
    ]);
  }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password || !form.phone || !form.address) {
      Alert.alert("Missing details", "Fill all required registration fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("password", form.password);
      payload.append("phone", form.phone);
      payload.append("address", form.address);
      payload.append("paymentMode", form.paymentMode);
      payload.append("fullDay", String(form.fullDay));
      if (!form.fullDay) {
        payload.append("shiftStartTime", formatTime(form.shiftStartTime));
        payload.append("shiftEndTime", formatTime(form.shiftEndTime));
      }
      documents.forEach((file) => {
        payload.append("documents", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        } as any);
      });

      await createStudent(payload);
      Alert.alert("Registered", "Student registration completed.");
      setForm(baseForm);
      setDocuments([]);
    } catch (error: any) {
      Alert.alert("Registration failed", error?.message || "Unable to register student");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Heading
        eyebrow="Registration"
        title="Register Student"
        subtitle="Capture documents, choose payment mode, and set shift time exactly."
      />

      <Card>
        <View style={styles.formGrid}>
          <Field label="Name" onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} value={form.name} />
          <Field autoCapitalize="none" label="Email" onChangeText={(value) => setForm((current) => ({ ...current, email: value }))} value={form.email} />
          <Field label="Password" onChangeText={(value) => setForm((current) => ({ ...current, password: value }))} secureTextEntry value={form.password} />
          <Field keyboardType="phone-pad" label="Phone" onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))} value={form.phone} />
          <Field label="Address" onChangeText={(value) => setForm((current) => ({ ...current, address: value }))} value={form.address} />
          <View style={styles.paymentSection}>
            <Text style={styles.sectionLabel}>Payment Mode</Text>
            <View style={styles.paymentGrid}>
              {[
                { label: "Cash", value: "cash", icon: "cash-outline" as const },
                { label: "Online", value: "online", icon: "phone-portrait-outline" as const },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setForm((current) => ({ ...current, paymentMode: option.value }))}
                  style={[
                    styles.paymentCard,
                    form.paymentMode === option.value ? styles.paymentCardActive : null,
                  ]}
                >
                  <View style={styles.paymentIconWrap}>
                    <Ionicons
                      color={form.paymentMode === option.value ? "#065f46" : colors.primary}
                      name={option.icon}
                      size={20}
                    />
                  </View>
                  <Text style={[styles.paymentTitle, form.paymentMode === option.value ? styles.paymentTitleActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Full day</Text>
            <Switch
              onValueChange={(value) => setForm((current) => ({ ...current, fullDay: value }))}
              trackColor={{ false: "#cbd5d1", true: "#a7f3d0" }}
              value={form.fullDay}
            />
          </View>

          <View style={styles.timeGrid}>
            <TimeField
              disabled={form.fullDay}
              label="Shift Start"
              value={formatTime(form.shiftStartTime)}
              onPress={() => setShowPicker("start")}
            />
            <TimeField
              disabled={form.fullDay}
              label="Shift End"
              value={formatTime(form.shiftEndTime)}
              onPress={() => setShowPicker("end")}
            />
          </View>

          <View style={styles.actionGrid}>
            <Pressable onPress={handlePickDocuments} style={styles.actionButton}>
              <View style={styles.actionIconWrap}>
                <Ionicons color={colors.primary} name="document-attach-outline" size={22} />
              </View>
              <Text style={styles.actionTitle}>Upload Documents</Text>
              <Text style={styles.actionHint}>Pick image or PDF files</Text>
            </Pressable>
            <Pressable onPress={handleOpenCamera} style={styles.actionButton}>
              <View style={styles.actionIconWrap}>
                <Ionicons color={colors.primary} name="camera-outline" size={22} />
              </View>
              <Text style={styles.actionTitle}>Open Camera</Text>
              <Text style={styles.actionHint}>Click document photos</Text>
            </Pressable>
          </View>

          {pickedFiles.length ? (
            <View style={styles.fileList}>
              {pickedFiles.map((name) => (
                <Text key={name} style={styles.fileName}>
                  {name}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <AppButton label={submitting ? "Registering..." : "Register Student"} onPress={handleSubmit} />
      </Card>

      {showPicker ? (
        <DateTimePicker
          display={Platform.OS === "ios" ? "spinner" : "default"}
          mode="time"
          value={showPicker === "start" ? form.shiftStartTime : form.shiftEndTime}
          onChange={(_event, value) => {
            setShowPicker("");
            if (!value) {
              return;
            }
            if (showPicker === "start") {
              setForm((current) => ({ ...current, shiftStartTime: value }));
            } else {
              setForm((current) => ({ ...current, shiftEndTime: value }));
            }
          }}
        />
      ) : null}
    </Screen>
  );
}

function TimeField({ disabled, label, onPress, value }: { disabled?: boolean; label: string; onPress: () => void; value: string }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.timeField, disabled ? styles.timeFieldDisabled : null]}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{disabled ? "Full day" : value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  formGrid: {
    gap: 12,
  },
  switchRow: {
    alignItems: "center",
    backgroundColor: "#f3f7f3",
    borderColor: "#d7e6da",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  paymentSection: {
    gap: 10,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  paymentGrid: {
    flexDirection: "row",
    gap: 12,
  },
  paymentCard: {
    alignItems: "center",
    backgroundColor: "#f8fbf8",
    borderColor: "#d7e6da",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  paymentCardActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  paymentIconWrap: {
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    marginBottom: 8,
    width: 40,
  },
  paymentTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  paymentTitleActive: {
    color: "#065f46",
  },
  timeGrid: {
    gap: 12,
  },
  timeField: {
    backgroundColor: "#f8fbf8",
    borderColor: "#d7e6da",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timeFieldDisabled: {
    opacity: 0.6,
  },
  timeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  timeValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#f3f7f3",
    borderColor: "#d7e6da",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIconWrap: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginBottom: 10,
    width: 42,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  actionHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  fileList: {
    backgroundColor: "#f8fbf8",
    borderColor: "#d7e6da",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fileName: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
});
