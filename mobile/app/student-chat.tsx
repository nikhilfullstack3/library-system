import React from "react";
import { Redirect } from "expo-router";
import { StudentChatScreen } from "../src/screens/StudentChatScreen";
import { useAuth } from "../src/context/AuthContext";

export default function StudentChatRoute() {
  const { booting, session } = useAuth();

  if (booting) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role !== "student") {
    return <Redirect href="/(librarian)/dashboard" />;
  }

  return <StudentChatScreen />;
}
