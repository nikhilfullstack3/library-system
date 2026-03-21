import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton, Card, Field, Heading, LoadingView, Screen } from "../../../src/components/ui";
import { useAuth } from "../../../src/context/AuthContext";
import { API_ORIGIN } from "../../../src/lib/api";
import { colors } from "../../../src/theme/colors";

function badgeTone(status: string) {
  if (status === "paid" || status === "verified") {
    return { bg: "#ddf3e3", text: colors.success };
  }

  if (status === "pending" || status === "not verified") {
    return { bg: "#f8ead2", text: colors.warning };
  }

  return { bg: "#eef2ef", text: colors.textMuted };
}

function resolveUrl(url = "") {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}

export default function LibrarianStudentDetailScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const { fetchStudentById, updateStudent } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);

  useEffect(() => {
    if (!studentId) return;

    let active = true;

    fetchStudentById(studentId)
      .then((data) => {
        if (active) {
          setStudent(data);
        }
      })
      .catch((error: any) => {
        Alert.alert("Unable to load student", error?.message || "Try again");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchStudentById, studentId]);

  async function handlePickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ["image/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    setDocumentFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || "application/octet-stream",
    });
  }

  async function handleUpload() {
    if (!studentId || !documentFile) {
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", {
        uri: documentFile.uri,
        name: documentFile.name,
        type: documentFile.mimeType || "application/octet-stream",
      } as any);

      if (documentName.trim()) {
        formData.append("documentName", documentName.trim());
      }

      await updateStudent(studentId, formData);
      const refreshed = await fetchStudentById(studentId);
      setStudent(refreshed);
      setDocumentName("");
      setDocumentFile(null);
      Alert.alert("Uploaded", "Document uploaded successfully.");
    } catch (error: any) {
      Alert.alert("Upload failed", error?.message || "Unable to upload document");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <LoadingView label="Loading student..." />;
  }

  if (!student) {
    return (
      <Screen scroll>
        <AppButton label="Back to Students" onPress={() => router.back()} variant="secondary" />
        <Card>
          <Text style={styles.errorText}>Student not found.</Text>
        </Card>
      </Screen>
    );
  }

  const paymentTone = badgeTone(student.paymentStatus);
  const documentTone = badgeTone(student.documentVerificationStatus);
  const presenceTone = student.currentlyInLibrary ? { bg: "#ddf3e3", text: colors.success } : { bg: "#eef2ef", text: colors.textMuted };

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons color={colors.primary} name="arrow-back" size={20} />
        <Text style={styles.backText}>Back to Students</Text>
      </Pressable>

      <Heading
        eyebrow="Student Details"
        title={student.name}
        subtitle={`Seat ${student.seatNumber || "-"} • ${student.shiftTiming || student.shift || "-"}`}
      />

      <Card>
        <View style={styles.badgeRow}>
          <StatusChip bg={presenceTone.bg} color={presenceTone.text} label={student.currentlyInLibrary ? "Inside library" : "Outside"} />
          <StatusChip bg={paymentTone.bg} color={paymentTone.text} label={student.paymentStatus || "unknown"} />
          <StatusChip bg={documentTone.bg} color={documentTone.text} label={student.documentVerificationStatus || "not uploaded"} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <DetailRow label="Email" value={student.email || "-"} />
        <DetailRow label="Phone" value={student.phone || "-"} />
        <DetailRow label="Address" value={student.address || "-"} />
        <DetailRow label="Shift" value={student.shift || "-"} />
        <DetailRow label="Shift Timing" value={student.shiftTiming || "-"} />
        <DetailRow label="Hours Spent" value={String(student.hoursSpent || 0)} />
        <DetailRow label="Login ID" value={student.loginId || "-"} />
        <DetailRow label="Password" value={student.issuedPassword || "Issued after payment"} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Upload Document</Text>
        <Field
          label="Document Name"
          onChangeText={setDocumentName}
          placeholder="Aadhaar Card"
          value={documentName}
        />
        <AppButton label={documentFile ? `Selected: ${documentFile.name}` : "Choose Document"} onPress={handlePickDocument} variant="secondary" />
        <AppButton label={uploading ? "Uploading..." : "Upload Document"} onPress={handleUpload} disabled={!documentFile || uploading} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Documents</Text>
        {(student.uploadedDocuments || []).length ? (
          student.uploadedDocuments.map((document: any) => (
            <View key={document.id} style={styles.documentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.documentTitle}>{document.document}</Text>
                <Text style={styles.documentMeta}>{document.fileName || "Attached file"}</Text>
              </View>
              <Pressable onPress={() => Linking.openURL(resolveUrl(document.fileUrl))} style={styles.downloadButton}>
                <Ionicons color={colors.primary} name="download-outline" size={18} />
                <Text style={styles.downloadText}>Download</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No documents uploaded yet.</Text>
        )}
      </Card>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function StatusChip({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  documentTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  documentMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  downloadText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "700",
  },
});
