import { CameraView, useCameraPermissions } from "expo-camera";
import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function StudentAttendanceScanScreen() {
  const { session, scanAttendanceQr } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role !== "student") {
    return <Redirect href="/(librarian)/dashboard" />;
  }

  async function handleBarcodeScan(result: { data: string }) {
    if (scanning) {
      return;
    }

    setScanning(true);
    try {
      const response = await scanAttendanceQr(result.data);
      Alert.alert("Attendance updated", response.message, [
        {
          text: "OK",
          onPress: () => router.replace("/student-chat"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Scan failed", error?.message || "Unable to process QR code", [
        {
          text: "Try again",
          onPress: () => setScanning(false),
        },
      ]);
    }
  }

  if (!permission) {
    return <View style={styles.center}><Text style={styles.helper}>Checking camera permission…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.helper}>Allow camera access to scan the library attendance QR.</Text>
        <Pressable onPress={() => requestPermission()} style={styles.actionButton}>
          <Text style={styles.actionText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScan}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace("/student-chat")} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Scan library QR</Text>
        </View>
        <View style={styles.focusFrame} />
        <Text style={styles.helper}>Point the camera at the library QR to check in or check out.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 56,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  topBar: {
    gap: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    color: "#fff",
    fontWeight: "700",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  helper: {
    color: "#e5f6ea",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  focusFrame: {
    alignSelf: "center",
    width: 240,
    height: 240,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
    gap: 12,
  },
  actionButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
});
