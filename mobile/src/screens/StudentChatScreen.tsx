import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN } from "../lib/api";
import { colors } from "../theme/colors";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const SHIFT_END_WARNING_MS = 30 * 60 * 1000;

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function renderLinkedText(text: string, textStyle: any, linkStyle: any) {
  const parts = text.split(URL_PATTERN);

  return (
    <Text style={textStyle}>
      {parts.map((part, index) =>
        part.match(URL_PATTERN) ? (
          <Text key={`${part}-${index}`} onPress={() => Linking.openURL(part)} style={linkStyle}>
            {part}
          </Text>
        ) : (
          <Text key={`${part}-${index}`}>{part}</Text>
        )
      )}
    </Text>
  );
}

function resolveAssetUrl(url = "") {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}

function getShiftEndDate(student: any) {
  if (!student?.shiftEndTime || student?.fullDay) {
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

function getAttendanceDisplay(student: any) {
  if (!student?.currentlyInLibrary || !student?.activeSessionStartedAt) {
    return student?.shiftTiming || student?.shift || "-";
  }

  const elapsedMs = Math.max(0, Date.now() - new Date(student.activeSessionStartedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function getShiftWarning(student: any) {
  if (!student?.currentlyInLibrary) {
    return null;
  }

  const shiftEndDate = getShiftEndDate(student);
  if (!shiftEndDate) {
    return null;
  }

  const remainingMs = shiftEndDate.getTime() - Date.now();
  if (remainingMs <= 0) {
    return "Your shift has ended. Please check out now.";
  }

  if (remainingMs > SHIFT_END_WARNING_MS) {
    return null;
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Shift ends in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export function StudentChatScreen() {
  const { fetchChatMessages, logout, refreshStudentData, sendChatMessage, session, studentData, subscribeToLibraryEvents } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<{ uri: string; name: string; mimeType?: string; size?: number } | null>(null);
  const [, setTimerTick] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const loadMessages = useCallback(async () => {
    const nextMessages = await fetchChatMessages();
    setMessages(nextMessages);
  }, [fetchChatMessages]);

  useEffect(() => {
    loadMessages().catch(() => {});
  }, [loadMessages]);

  useEffect(() => {
    return subscribeToLibraryEvents({
      onAccessUpdate: async () => {
        if (session?.studentId) {
          await refreshStudentData(session.studentId);
        }
        await loadMessages();
      },
      onMessage: async () => {
        if (session?.studentId) {
          await refreshStudentData(session.studentId);
        }
        await loadMessages();
      },
    });
  }, [loadMessages, refreshStudentData, session?.studentId, subscribeToLibraryEvents]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => setTimerTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/(student)/profile");
      return true;
    });

    return () => subscription.remove();
  }, [router]);

  async function handlePickAttachment() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ["image/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_ATTACHMENT_SIZE) {
        Alert.alert("File too large", `Please upload a file smaller than ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
        return;
      }

      setAttachment({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      });
    } catch (error: any) {
      Alert.alert("Attachment failed", error?.message || "Unable to select file");
    }
  }

  async function handleSend() {
    if ((!input.trim() && !attachment) || studentData?.student?.chatEnabled === false) return;
    setSending(true);
    try {
      await sendChatMessage({ message: input.trim() || (attachment?.name ? `Shared ${attachment.name}` : ""), attachment });
      setInput("");
      setAttachment(null);
      await loadMessages();
    } catch (error: any) {
      Alert.alert("Message failed", error?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  }

  const attendanceStatus = studentData?.student?.currentlyInLibrary ? "Checked In" : "Checked Out";
  const attendanceTimer = getAttendanceDisplay(studentData?.student);
  const shiftWarning = getShiftWarning(studentData?.student);

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
        style={styles.keyboardWrap}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerMain}>
            <Pressable onPress={() => router.replace("/(student)/profile")} style={styles.iconButton}>
              <Ionicons color="#0f2a1d" name="person-circle-outline" size={26} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.headerTitle}>
                {studentData?.student?.library?.name || "Library Chat"}
              </Text>
              <Text style={styles.headerSubtitle}>{session?.name}</Text>
            </View>
          </View>
          <Pressable onPress={logout} style={styles.iconButton}>
            <Ionicons color="#0f2a1d" name="log-out-outline" size={22} />
          </Pressable>
        </View>

        <View style={[styles.attendanceStrip, shiftWarning ? styles.attendanceStripWarning : null]}>
          <View>
            <Text style={[styles.attendanceLabel, shiftWarning ? styles.attendanceLabelWarning : null]}>{attendanceStatus}</Text>
            <Text style={[styles.attendanceMeta, shiftWarning ? styles.attendanceMetaWarning : null]}>
              {studentData?.student?.currentlyInLibrary ? `Live timer ${attendanceTimer || "00h 00m 00s"}` : `Shift ${attendanceTimer}`}
            </Text>
            {shiftWarning ? <Text style={styles.warningText}>{shiftWarning}</Text> : null}
          </View>
          <Pressable onPress={() => router.push("/student-attendance-scan" as never)} style={styles.scanButton}>
            <Ionicons color="#fff" name="qr-code-outline" size={18} />
            <Text style={styles.scanButtonText}>Scan QR</Text>
          </Pressable>
        </View>

        <View style={styles.chatShell}>
          <ScrollView
            contentContainerStyle={[styles.messagesContent, { paddingBottom: 92 + Math.max(insets.bottom, 10) }]}
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            style={styles.messagesScroll}
          >
            {messages.map((message) => {
              const isOwn = message.senderName === session?.name;
              const isAdmin = message.senderRole === "admin";
              const attachmentUrl = resolveAssetUrl(message.attachmentUrl);

              return (
                <View key={message.id} style={[styles.row, isOwn ? styles.rowRight : styles.rowLeft]}>
                  <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                    {!isOwn ? (
                      <Text style={[styles.sender, isAdmin ? styles.senderAdmin : null]}>
                        {isAdmin ? `${message.senderName} (Admin)` : message.senderName}
                      </Text>
                    ) : null}
                    {message.message ? renderLinkedText(message.message, styles.messageText, styles.messageLink) : null}
                    {message.attachmentUrl ? (
                      message.attachmentType === "image" ? (
                        <Pressable onPress={() => Linking.openURL(attachmentUrl)}>
                          <Image source={{ uri: attachmentUrl }} style={styles.imageAttachment} />
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => Linking.openURL(attachmentUrl)} style={styles.fileAttachment}>
                          <Ionicons color="#2563eb" name="document-text-outline" size={18} />
                          <Text numberOfLines={1} style={styles.fileAttachmentText}>
                            {message.attachmentName || "Attachment"}
                          </Text>
                        </Pressable>
                      )
                    ) : null}
                    <Text style={styles.metaText}>
                      {String(message.senderRole).toUpperCase()} • {formatTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.bottomArea}>
            {attachment ? (
              <View style={styles.attachmentPreview}>
                <View style={styles.attachmentInfo}>
                  <Ionicons color={colors.primary} name="attach-outline" size={18} />
                  <Text numberOfLines={1} style={styles.attachmentName}>
                    {attachment.name}
                  </Text>
                  <Text style={styles.attachmentSize}>{formatFileSize(attachment.size || 0)}</Text>
                </View>
                <Pressable onPress={() => setAttachment(null)}>
                  <Ionicons color={colors.textMuted} name="close-circle" size={20} />
                </Pressable>
              </View>
            ) : null}

            <View style={[styles.composerBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <Pressable
                disabled={studentData?.student?.chatEnabled === false}
                onPress={handlePickAttachment}
                style={styles.attachButton}
              >
                <Ionicons color={colors.primary} name="attach" size={20} />
              </Pressable>
              <TextInput
                editable={studentData?.student?.chatEnabled !== false}
                onChangeText={setInput}
                placeholder={studentData?.student?.chatEnabled === false ? "Chat access removed by admin" : "Message"}
                placeholderTextColor="#8ea292"
                style={styles.input}
                value={input}
              />
              <Pressable
                disabled={studentData?.student?.chatEnabled === false || sending}
                onPress={handleSend}
                style={[styles.sendButton, studentData?.student?.chatEnabled === false || sending ? styles.sendButtonDisabled : null]}
              >
                <Ionicons color="#fff" name="send" size={18} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
    backgroundColor: "#dfece3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#edf7ef",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  attendanceStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#e4f3e8",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  attendanceStripWarning: {
    backgroundColor: "#fee2e2",
  },
  attendanceLabel: {
    color: "#0f2a1d",
    fontSize: 15,
    fontWeight: "800",
  },
  attendanceLabelWarning: {
    color: "#b91c1c",
  },
  attendanceMeta: {
    color: "#537261",
    fontSize: 12,
    marginTop: 2,
  },
  attendanceMetaWarning: {
    color: "#dc2626",
  },
  warningText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  headerMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: "#0f2a1d",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#537261",
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chatShell: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#e9f4ec",
    position: "relative",
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 2,
  },
  row: {
    width: "100%",
    marginBottom: 10,
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  bubbleOwn: {
    backgroundColor: "#dcf8c6",
    borderBottomRightRadius: 8,
  },
  bubbleOther: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 8,
  },
  sender: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  senderAdmin: {
    color: "#1f7a46",
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  messageLink: {
    color: "#2563eb",
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
    alignSelf: "flex-end",
  },
  imageAttachment: {
    width: 220,
    height: 180,
    borderRadius: 16,
    backgroundColor: "#d9e8dc",
  },
  fileAttachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: "#f3f7f4",
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  fileAttachmentText: {
    color: "#2563eb",
    fontSize: 13,
    flexShrink: 1,
    textDecorationLine: "underline",
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fdfefe",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bottomArea: {
    backgroundColor: "#edf7ef",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
  },
  attachmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  attachmentName: {
    color: colors.text,
    fontSize: 13,
    flexShrink: 1,
  },
  attachmentSize: {
    color: colors.textMuted,
    fontSize: 11,
  },
  composerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#edf7ef",
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 100,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
});
