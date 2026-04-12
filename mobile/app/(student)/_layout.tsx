import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { colors } from "../../src/theme/colors";

const darkColors = {
  surface: "#1a1a2e",
  border: "#2d2d44",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  primary: "#34d399",
  background: "#0d0d1a",
};

export default function StudentLayout() {
  const { booting, logout, session } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (booting) return null;
  if (!session) return <Redirect href="/login" />;
  if (session.role !== "student") return <Redirect href="/(librarian)/dashboard" />;

  const c = isDark ? darkColors : colors;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTitleStyle: { color: c.text, fontWeight: "700" },
        headerTintColor: c.primary,
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 12, gap: 4 }}>
            <Pressable hitSlop={10} onPress={toggleDark} style={{ padding: 4 }}>
              <Ionicons
                color={c.primary}
                name={isDark ? "sunny-outline" : "moon-outline"}
                size={22}
              />
            </Pressable>
            <Pressable hitSlop={10} onPress={() => logout()} style={{ padding: 4 }}>
              <Ionicons color={c.primary} name="log-out-outline" size={22} />
            </Pressable>
          </View>
        ),
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: 68 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="chatbubble-ellipses-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} />,
        }}
      />
    </Tabs>
  );
}
