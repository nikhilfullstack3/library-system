import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Redirect, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Heading, LoadingView, Screen, StatCard } from "../src/components/ui";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

const initialForm = {
  name: "",
  email: "",
  password: "",
  libraryName: "",
  location: "",
  latitude: "",
  longitude: "",
};

export default function SuperAdminScreen() {
  const { booting, createLibraryAccount, logout, refreshSuperAdminData, session, superAdminData } = useAuth();
  const [activeTab, setActiveTab] = useState<"registration" | "libraries">("libraries");
  const [locationFilter, setLocationFilter] = useState("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);

  useEffect(() => {
    refreshSuperAdminData().catch(() => {});
  }, [refreshSuperAdminData]);

  const filteredLibraries = useMemo(() => {
    const value = locationFilter.trim().toLowerCase();
    if (!value) {
      return superAdminData?.libraries || [];
    }

    return (superAdminData?.libraries || []).filter((library: any) =>
      [library.name, library.location, library.contactEmail].some((item) => String(item || "").toLowerCase().includes(value))
    );
  }, [locationFilter, superAdminData?.libraries]);

  if (booting) {
    return <LoadingView label="Loading super admin dashboard..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role !== "super_admin") {
    return <Redirect href={session.role === "student" ? "/student-chat" : "/(librarian)/dashboard"} />;
  }

  const summary = [
    { label: "Libraries", value: String(superAdminData?.summary?.totalLibraries || 0) },
    { label: "Students", value: String(superAdminData?.summary?.totalStudents || 0) },
    { label: "Revenue", value: `Rs ${superAdminData?.summary?.totalRevenue || 0}` },
  ];

  async function handleCreateLibrary() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.libraryName.trim()) {
      Alert.alert("Missing details", "Enter the library admin name, email, password, and library name.");
      return;
    }

    setSubmitting(true);
    try {
      await createLibraryAccount(form);
      setCreatedCredentials({
        adminName: form.name,
        email: form.email,
        password: form.password,
        libraryName: form.libraryName,
        location: form.location || "Unspecified",
      });
      setForm(initialForm);
      setActiveTab("libraries");
      Alert.alert("Library created", "The new library account was created successfully.");
    } catch (error: any) {
      Alert.alert("Unable to create library", error?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "Allow location access to fill the library location automatically.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = current.coords.latitude.toFixed(6);
      const longitude = current.coords.longitude.toFixed(6);
      let locationText = `Lat ${latitude}, Lng ${longitude}`;

      try {
        const reversed = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        const first = reversed?.[0];
        const parts = [first?.district, first?.city, first?.region].filter(Boolean);
        if (parts.length) {
          locationText = parts.join(", ");
        }
      } catch {}

      setForm((currentForm) => ({
        ...currentForm,
        latitude,
        longitude,
        location: currentForm.location || locationText,
      }));
    } catch {
      Alert.alert("Location unavailable", "Unable to fetch the current location.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Heading
            eyebrow="Super Admin"
            title="Platform Control"
            subtitle={`Welcome, ${session.name}. Register libraries here and see all libraries by location.`}
          />
        </View>
        <Pressable hitSlop={10} onPress={() => logout()} style={styles.logoutButton}>
          <Ionicons color={colors.primary} name="log-out-outline" size={22} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {summary.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </View>

      <View style={styles.tabRow}>
        <TabButton active={activeTab === "registration"} label="Registration" onPress={() => setActiveTab("registration")} />
        <TabButton active={activeTab === "libraries"} label="Libraries" onPress={() => setActiveTab("libraries")} />
      </View>

      {activeTab === "registration" ? (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Library registration</Text>
            <View style={styles.stack}>
              <TextInput placeholder="Admin full name" placeholderTextColor="#8ea292" style={styles.input} value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} />
              <TextInput autoCapitalize="none" placeholder="Admin email / login ID" placeholderTextColor="#8ea292" style={styles.input} value={form.email} onChangeText={(value) => setForm((current) => ({ ...current, email: value }))} />
              <TextInput placeholder="Temporary password" placeholderTextColor="#8ea292" style={styles.input} value={form.password} onChangeText={(value) => setForm((current) => ({ ...current, password: value }))} />
              <TextInput placeholder="Library name" placeholderTextColor="#8ea292" style={styles.input} value={form.libraryName} onChangeText={(value) => setForm((current) => ({ ...current, libraryName: value }))} />
              <View style={styles.locationCard}>
                <View style={styles.locationHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationTitle}>Location</Text>
                    <Text style={styles.helperText}>Use current location or edit the text manually.</Text>
                  </View>
                  <Pressable onPress={useCurrentLocation} style={[styles.locationButton, locating ? styles.actionButtonDisabled : null]}>
                    <Ionicons color={colors.primary} name="locate-outline" size={16} />
                    <Text style={styles.locationButtonText}>{locating ? "Detecting..." : "Use Current"}</Text>
                  </Pressable>
                </View>
                <TextInput placeholder="Location" placeholderTextColor="#8ea292" style={styles.input} value={form.location} onChangeText={(value) => setForm((current) => ({ ...current, location: value }))} />
                {(form.latitude || form.longitude) ? <Text style={styles.coordinateText}>Coordinates: {form.latitude || "-"}, {form.longitude || "-"}</Text> : null}
              </View>
              <Pressable onPress={handleCreateLibrary} style={[styles.actionButton, submitting ? styles.actionButtonDisabled : null]}>
                <Text style={styles.actionButtonText}>{submitting ? "Creating..." : "Register library"}</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Issued ID and password</Text>
            {createdCredentials ? (
              <View style={styles.stack}>
                <CredentialRow label="Library" value={createdCredentials.libraryName} />
                <CredentialRow label="Location" value={createdCredentials.location} />
                <CredentialRow label="Admin" value={createdCredentials.adminName} />
                <CredentialRow label="Login ID" value={createdCredentials.email} />
                <CredentialRow label="Password" value={createdCredentials.password} />
              </View>
            ) : (
              <Text style={styles.helperText}>Create a library from this tab. The issued admin email and password will be shown here immediately.</Text>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Libraries by location</Text>
            <TextInput
              onChangeText={setLocationFilter}
              placeholder="Search by location or library"
              placeholderTextColor="#8ea292"
              style={styles.input}
              value={locationFilter}
            />
          </Card>

          {(superAdminData?.locations || []).map((item: any) => {
            const locationLibraries = filteredLibraries.filter((library: any) => (library.location || "Unspecified") === item.location);

            if (!locationLibraries.length) {
              return null;
            }

            return (
              <Card key={item.location}>
                <View style={styles.locationHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>{item.location}</Text>
                    <Text style={styles.helperText}>{item.libraries} libraries</Text>
                  </View>
                  <Text style={styles.revenueText}>Rs {item.revenue}</Text>
                </View>
                <View style={styles.stack}>
                  {locationLibraries.map((library: any) => (
                    <Pressable key={library.id} onPress={() => router.push(`/super-admin-library/${library.id}`)} style={styles.libraryCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{library.name}</Text>
                        <Text style={styles.rowMeta}>{library.contactEmail}</Text>
                      </View>
                      <View style={styles.libraryStats}>
                        <Text style={styles.libraryStat}>Students {library.totalStudents}</Text>
                        <Text style={styles.libraryStat}>Rs {library.totalRevenue}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active ? styles.tabButtonActive : null]}>
      <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.credentialRow}>
      <Text style={styles.credentialLabel}>{label}</Text>
      <Text style={styles.credentialValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
  },
  tabButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
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
  locationCard: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
  },
  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  coordinateText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  stack: {
    gap: 12,
  },
  actionButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  credentialRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 14,
  },
  credentialLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  credentialValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  revenueText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  libraryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 16,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  libraryStats: {
    alignItems: "flex-end",
    gap: 4,
  },
  libraryStat: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
