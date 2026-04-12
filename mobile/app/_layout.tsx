import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";
import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="super-admin" />
          <Stack.Screen name="super-admin-library/[libraryId]" />
          <Stack.Screen name="student-attendance-scan" />
          <Stack.Screen name="student-chat" />
          <Stack.Screen name="librarian-chat" />
          <Stack.Screen name="(librarian)" />
          <Stack.Screen name="(student)" />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
