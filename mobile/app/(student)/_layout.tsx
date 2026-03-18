import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function StudentLayout() {
  const { booting, logout, session } = useAuth();
  const insets = useSafeAreaInsets();

  if (booting) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role !== "student") {
    return <Redirect href="/(librarian)/dashboard" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerTintColor: colors.primary,
        headerRight: () => (
          <Pressable hitSlop={10} onPress={() => logout()} style={{ marginRight: 16 }}>
            <Ionicons color={colors.primary} name="log-out-outline" size={22} />
          </Pressable>
        ),
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
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
