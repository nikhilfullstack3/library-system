import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "library-app-session";

function loadStoredState() {
  if (typeof window === "undefined") {
    return {
      libraryData: null,
      session: null,
      studentData: null,
    };
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {
      libraryData: null,
      session: null,
      studentData: null,
    };
  } catch {
    return {
      libraryData: null,
      session: null,
      studentData: null,
    };
  }
}

export function AuthProvider({ children }) {
  const stored = loadStoredState();
  const [session, setSession] = useState(stored.session);
  const [libraryData, setLibraryData] = useState(stored.libraryData);
  const [studentData, setStudentData] = useState(stored.studentData);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        session,
        libraryData,
        studentData,
      })
    );
  }, [libraryData, session, studentData]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if ((session.role === "admin" || session.role === "librarian") && !libraryData) {
      refreshLibraryData();
    }

    if (session.role === "student" && !studentData && session.studentId) {
      refreshStudentData(session.studentId);
    }
  }, [libraryData, session, studentData]);

  async function login(role, email, password) {
    const path = role === "student" ? "/auth/students/login" : "/auth/login";
    const data = await apiRequest(path, {
      method: "POST",
      body: { email, password },
    });

    setAuthError("");

    if (role === "student") {
      const nextSession = {
        role: "student",
        studentId: data.session.studentId,
        libraryId: data.session.libraryId,
        name: data.dashboard.student.name,
        email,
      };
      setSession(nextSession);
      setStudentData(data.dashboard);
      setLibraryData(null);
      return nextSession;
    }

    const nextSession = {
      role: data.session.role,
      libraryId: data.session.libraryId,
      librarianId: data.session.librarianId,
      name: data.librarian.name,
      email,
    };
    setSession(nextSession);
    setLibraryData(data.dashboard);
    setStudentData(null);
    return nextSession;
  }

  async function refreshLibraryData() {
    if (!session?.libraryId) {
      return null;
    }

    const dashboard = await apiRequest(`/auth/libraries/${session.libraryId}/dashboard`);
    setLibraryData(dashboard);
    return dashboard;
  }

  async function refreshStudentData(studentId = session?.studentId) {
    if (!session?.libraryId || !studentId) {
      return null;
    }

    const dashboard = await apiRequest(`/auth/libraries/${session.libraryId}/students/${studentId}/dashboard`);
    setStudentData(dashboard);
    return dashboard;
  }

  async function updateStudentProfile(formData, studentId = session?.studentId) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/students/${studentId}/profile`, {
      method: "PATCH",
      body: formData,
    });
    setStudentData(data.dashboard);
    return data;
  }

  async function changeStudentPassword(password, studentId = session?.studentId) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/students/${studentId}/change-password`, {
      method: "POST",
      body: { password },
    });
    setStudentData(data.dashboard);
    return data;
  }

  async function createStudent(formData) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/students`, {
      method: "POST",
      body: formData,
    });
    await refreshLibraryData();
    return data;
  }

  async function updateStudent(studentId, formData) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/students/${studentId}`, {
      method: "PATCH",
      body: formData,
    });
    await refreshLibraryData();
    return data;
  }

  async function deleteStudent(studentId) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/students/${studentId}`, {
      method: "DELETE",
    });
    await refreshLibraryData();
    return data;
  }

  async function markPresent(studentId) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/attendance/mark-present`, {
      method: "POST",
      body: { studentId },
    });
    await refreshLibraryData();
    return data;
  }

  async function markPaymentPaid(paymentId) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/payments/${paymentId}/mark-paid`, {
      method: "POST",
    });
    await refreshLibraryData();
    return data;
  }

  async function createLibrarian(payload) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/librarians`, {
      method: "POST",
      body: payload,
    });
    await refreshLibraryData();
    return data;
  }

  async function fetchChatMessages() {
    if (!session?.libraryId) {
      return [];
    }

    return apiRequest(`/auth/libraries/${session.libraryId}/chat`);
  }

  async function sendChatMessage({ attachment, message, tag }) {
    const formData = new FormData();
    formData.append("senderId", session?.studentId || session?.librarianId || "");
    formData.append("senderName", session?.name || "");
    formData.append("senderRole", session?.role || "");
    formData.append("message", message);
    formData.append("tag", tag || "");
    if (attachment) {
      formData.append("attachment", attachment);
    }

    const data = await apiRequest(`/auth/libraries/${session.libraryId}/chat`, {
      method: "POST",
      body: formData,
    });

    if (session?.role === "student" && session.studentId) {
      await refreshStudentData(session.studentId);
    } else {
      await refreshLibraryData();
    }

    return data;
  }

  async function updateChatAccess(participantType, participantId, chatEnabled) {
    const data = await apiRequest(
      `/auth/libraries/${session.libraryId}/chat/access/${participantType}/${participantId}`,
      {
        method: "PATCH",
        body: { chatEnabled },
      }
    );
    await refreshLibraryData();
    return data;
  }

  function logout() {
    setSession(null);
    setLibraryData(null);
    setStudentData(null);
    setAuthError("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const value = useMemo(
    () => ({
      authError,
      changeStudentPassword,
      createLibrarian,
      createStudent,
      deleteStudent,
      fetchChatMessages,
      libraryData,
      login,
      logout,
      markPaymentPaid,
      markPresent,
      refreshLibraryData,
      refreshStudentData,
      session,
      sendChatMessage,
      setAuthError,
      studentData,
      updateStudentProfile,
      updateChatAccess,
      updateStudent,
    }),
    [authError, libraryData, session, studentData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
