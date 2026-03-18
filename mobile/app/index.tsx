import { Redirect } from "expo-router";
import React from "react";
import { LoadingView } from "../src/components/ui";
import { useAuth } from "../src/context/AuthContext";

export default function IndexScreen() {
  const { booting, session } = useAuth();

  if (booting) {
    return <LoadingView label="Preparing mobile app..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.role === "student") {
    return <Redirect href="/student-chat" />;
  }

  if (session.role === "super_admin") {
    return <Redirect href="/super-admin" />;
  }

  return <Redirect href="/(librarian)/dashboard" />;
}
