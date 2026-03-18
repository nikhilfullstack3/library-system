import React from "react";
import { Redirect } from "expo-router";
import { LibrarianChatScreen } from "../src/screens/LibrarianChatScreen";
import { useAuth } from "../src/context/AuthContext";

export default function LibrarianChatRoute() {
  const { booting, session } = useAuth();

  if (booting) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role === "student") {
    return <Redirect href="/student-chat" />;
  }

  return <LibrarianChatScreen />;
}
