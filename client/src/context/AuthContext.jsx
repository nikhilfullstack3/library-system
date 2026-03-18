import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_ORIGIN, apiRequest, setAuthToken } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "library-app-session";

function loadStoredState() {
  if (typeof window === "undefined") {
    return {
      libraryData: null,
      session: null,
      superAdminData: null,
      studentData: null,
    };
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {
      libraryData: null,
      session: null,
      studentData: null,
    };
    if (stored.session && !stored.session.token) {
      return {
        libraryData: null,
        session: null,
        superAdminData: null,
        studentData: null,
      };
    }
    return stored;
  } catch {
    return {
      libraryData: null,
      session: null,
      superAdminData: null,
      studentData: null,
    };
  }
}

export function AuthProvider({ children }) {
  const stored = loadStoredState();
  setAuthToken(stored.session?.token || "");
  const [session, setSession] = useState(stored.session);
  const [libraryData, setLibraryData] = useState(stored.libraryData);
  const [superAdminData, setSuperAdminData] = useState(stored.superAdminData);
  const [studentData, setStudentData] = useState(stored.studentData);
  const [authError, setAuthError] = useState("");
  const socketRef = useRef(null);

  const refreshLibraryData = useCallback(async () => {
    if (!session?.libraryId) {
      return null;
    }

    const dashboard = await apiRequest(`/auth/libraries/${session.libraryId}/dashboard`);
    setLibraryData(dashboard);
    return dashboard;
  }, [session?.libraryId]);

  const refreshSuperAdminData = useCallback(async (location = "") => {
    if (session?.role !== "super_admin") {
      return null;
    }

    const query = location ? `?location=${encodeURIComponent(location)}` : "";
    const dashboard = await apiRequest(`/auth/super-admin/dashboard${query}`);
    setSuperAdminData(dashboard);
    return dashboard;
  }, [session?.role]);

  const refreshStudentData = useCallback(async (studentId = session?.studentId) => {
    if (!session?.libraryId || !studentId) {
      return null;
    }

    const dashboard = await apiRequest(`/auth/libraries/${session.libraryId}/students/${studentId}/dashboard`);
    setStudentData(dashboard);
    return dashboard;
  }, [session?.libraryId, session?.studentId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        session,
        libraryData,
        superAdminData,
        studentData,
      })
    );
  }, [libraryData, session, studentData, superAdminData]);

  useEffect(() => {
    setAuthToken(session?.token || "");
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if ((session.role === "admin" || session.role === "librarian") && !libraryData) {
      refreshLibraryData();
    }

    if (session.role === "super_admin" && !superAdminData) {
      refreshSuperAdminData();
    }

    if (session.role === "student" && !studentData && session.studentId) {
      refreshStudentData(session.studentId);
    }
  }, [libraryData, refreshLibraryData, refreshStudentData, refreshSuperAdminData, session, studentData, superAdminData]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  async function login(role, email, password) {
    const path = role === "student" ? "/auth/students/login" : role === "super_admin" ? "/auth/super-admin/login" : "/auth/login";
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
        token: data.token,
      };
      setAuthToken(nextSession.token || "");
      setSession(nextSession);
      setStudentData(data.dashboard);
      setLibraryData(null);
      return nextSession;
    }

    if (role === "super_admin") {
      const nextSession = {
        role: "super_admin",
        superAdminId: data.session.superAdminId,
        name: data.superAdmin.name,
        email: data.superAdmin.email,
        token: data.token,
      };
      setAuthToken(nextSession.token || "");
      setSession(nextSession);
      setSuperAdminData(data.dashboard);
      setLibraryData(null);
      setStudentData(null);
      return nextSession;
    }

    const nextSession = {
      role: data.session.role,
      libraryId: data.session.libraryId,
      librarianId: data.session.librarianId,
      name: data.librarian.name,
      email,
      token: data.token,
    };
    setAuthToken(nextSession.token || "");
    setSession(nextSession);
    setLibraryData(data.dashboard);
    setSuperAdminData(null);
    setStudentData(null);
    return nextSession;
  }

  async function fetchSuperAdminLibrary(libraryId) {
    return apiRequest(`/auth/super-admin/libraries/${libraryId}`);
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
    return apiRequest(`/auth/libraries/${session.libraryId}/students`, {
      method: "POST",
      body: formData,
    });
  }

  async function createLibraryAccount(payload) {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: payload,
    });

    if (session?.role === "super_admin") {
      refreshSuperAdminData().catch(() => {});
    }

    return data;
  }

  async function updateStudent(studentId, formData) {
    return apiRequest(`/auth/libraries/${session.libraryId}/students/${studentId}`, {
      method: "PATCH",
      body: formData,
    });
  }

  async function deleteStudent(studentId) {
    return apiRequest(`/auth/libraries/${session.libraryId}/students/${studentId}`, {
      method: "DELETE",
    });
  }

  async function markPresent(studentId) {
    return apiRequest(`/auth/libraries/${session.libraryId}/attendance/mark-present`, {
      method: "POST",
      body: { studentId },
    });
  }

  async function fetchAttendanceQrToken() {
    return apiRequest(`/auth/libraries/${session.libraryId}/attendance/qr-token`);
  }

  async function scanAttendanceQr(token, studentId = session?.studentId) {
    const data = await apiRequest(`/auth/libraries/${session.libraryId}/attendance/scan`, {
      method: "POST",
      body: { token },
    });
    if (studentId) {
      setStudentData(data.dashboard);
    }
    return data;
  }

  async function markPaymentPaid(paymentId) {
    return apiRequest(`/auth/libraries/${session.libraryId}/payments/${paymentId}/mark-paid`, {
      method: "POST",
    });
  }

  async function createLibrarian(payload) {
    return apiRequest(`/auth/libraries/${session.libraryId}/librarians`, {
      method: "POST",
      body: payload,
    });
  }

  async function fetchChatMessages() {
    if (!session?.libraryId) {
      return [];
    }

    const data = await apiRequest(`/auth/libraries/${session.libraryId}/chat`);
    return data.items || [];
  }

  async function fetchStudents(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.search) params.set("search", String(options.search));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${session.libraryId}/students${query ? `?${query}` : ""}`);
  }

  async function fetchAttendance(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.dateKey) params.set("dateKey", String(options.dateKey));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${session.libraryId}/attendance${query ? `?${query}` : ""}`);
  }

  async function fetchPayments(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.status) params.set("status", String(options.status));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${session.libraryId}/payments${query ? `?${query}` : ""}`);
  }

  async function fetchDocuments(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.status) params.set("status", String(options.status));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${session.libraryId}/documents${query ? `?${query}` : ""}`);
  }

  async function sendChatMessage({ attachment, message, tag }) {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("tag", tag || "");
    if (attachment) {
      formData.append("attachment", attachment);
    }

    return apiRequest(`/auth/libraries/${session.libraryId}/chat`, {
      method: "POST",
      body: formData,
    });
  }

  async function updateChatAccess(participantType, participantId, chatEnabled) {
    return apiRequest(
      `/auth/libraries/${session.libraryId}/chat/access/${participantType}/${participantId}`,
      {
        method: "PATCH",
        body: { chatEnabled },
      }
    );
  }

  function subscribeToLibraryEvents(handlers = {}) {
    if (!session?.libraryId) {
      return () => {};
    }

    if (!socketRef.current) {
      socketRef.current = io(API_ORIGIN, {
        transports: ["websocket", "polling"],
      });
    }

    const socket = socketRef.current;
    socket.emit("library:join", session.libraryId);

    const messageHandler = (payload) => handlers.onMessage?.(payload);
    const accessHandler = (payload) => handlers.onAccessUpdate?.(payload);

    socket.on("chat:message", messageHandler);
    socket.on("chat:access-updated", accessHandler);

    return () => {
      socket.off("chat:message", messageHandler);
      socket.off("chat:access-updated", accessHandler);
      socket.emit("library:leave", session.libraryId);
    };
  }

  function logout() {
    if (socketRef.current && session?.libraryId) {
      socketRef.current.emit("library:leave", session.libraryId);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSession(null);
    setLibraryData(null);
    setSuperAdminData(null);
    setStudentData(null);
    setAuthError("");
    setAuthToken("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const value = useMemo(
    () => ({
      authError,
      changeStudentPassword,
      createLibraryAccount,
      createLibrarian,
      createStudent,
      deleteStudent,
      fetchAttendance,
      fetchAttendanceQrToken,
      fetchDocuments,
      fetchChatMessages,
      fetchPayments,
      fetchStudents,
      libraryData,
      login,
      logout,
      markPaymentPaid,
      markPresent,
      refreshLibraryData,
      refreshSuperAdminData,
      refreshStudentData,
      scanAttendanceQr,
      session,
      sendChatMessage,
      setAuthError,
      subscribeToLibraryEvents,
      superAdminData,
      studentData,
      updateStudentProfile,
      updateChatAccess,
      updateStudent,
      fetchSuperAdminLibrary,
    }),
    [authError, libraryData, refreshLibraryData, refreshStudentData, refreshSuperAdminData, session, studentData, superAdminData]
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
