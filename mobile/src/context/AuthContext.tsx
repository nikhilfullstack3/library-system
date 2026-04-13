import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_ORIGIN, apiRequest, setAuthToken } from "../lib/api";

const STORAGE_KEY = "library-mobile-session-v2";

type Session = {
  role: "admin" | "librarian" | "student" | "super_admin";
  libraryId?: string;
  librarianId?: string;
  studentId?: string;
  superAdminId?: string;
  name: string;
  email: string;
  token?: string;
};

type AuthContextValue = {
  authError: string;
  booting: boolean;
  createStudent: (formData: FormData) => Promise<any>;
  fetchAnalytics: (period?: string) => Promise<any>;
  fetchStudentById: (studentId: string) => Promise<any>;
  fetchStudents: (options?: { page?: number; limit?: number; search?: string }) => Promise<any>;
  fetchSuperAdminLibrary: (libraryId: string) => Promise<any>;
  libraryData: any;
  login: (role: "librarian" | "student" | "super_admin", email: string, password: string) => Promise<Session>;
  logout: () => Promise<void>;
  markPaymentPaid: (paymentId: string) => Promise<any>;
  refreshLibraryData: () => Promise<any>;
  refreshSuperAdminData: (location?: string) => Promise<any>;
  refreshStudentData: (studentId?: string) => Promise<any>;
  session: Session | null;
  setAuthError: React.Dispatch<React.SetStateAction<string>>;
  superAdminData: any;
  studentData: any;
  changeStudentPassword: (password: string, studentId?: string) => Promise<any>;
  createLibraryAccount: (payload: { name: string; email: string; password: string; libraryName: string; location?: string; latitude?: string | number; longitude?: string | number }) => Promise<any>;
  fetchChatMessages: () => Promise<any[]>;
  fetchAttendanceQrToken: () => Promise<any>;
  sendChatMessage: (payload: { message: string; tag?: string; attachment?: { uri: string; name: string; mimeType?: string } | null }) => Promise<any>;
  assignSeat: (seatId: string, phone: string) => Promise<any>;
  autoFreeSeat: () => Promise<any>;
  requestSeatChange: (seatNumber: string, reason: string) => Promise<any>;
  resolveSeatChangeRequest: (requestId: string, action: string) => Promise<any>;
  scanAttendanceQr: (token: string) => Promise<any>;
  subscribeToLibraryEvents: (handlers?: {
    onAccessUpdate?: (payload: any) => void;
    onMessage?: (payload: any) => void;
    onSeatChangeRequest?: (payload: any) => void;
    onSeatChangeResolved?: (payload: any) => void;
  }) => () => void;
  seedAnalyticsDemo: () => Promise<any>;
  updateChatAccess: (participantType: string, participantId: string, chatEnabled: boolean) => Promise<any>;
  updateStudent: (studentId: string, formData: FormData) => Promise<any>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadStoredState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : { session: null, libraryData: null, superAdminData: null, studentData: null };
    if (stored.session && !stored.session.token) {
      return { session: null, libraryData: null, superAdminData: null, studentData: null };
    }
    return stored;
  } catch {
    return { session: null, libraryData: null, superAdminData: null, studentData: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [libraryData, setLibraryData] = useState<any>(null);
  const [superAdminData, setSuperAdminData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [authError, setAuthError] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let active = true;

    loadStoredState().then((stored) => {
      if (!active) return;
      setAuthToken(stored.session?.token || "");
      setSession(stored.session);
      setLibraryData(stored.libraryData);
      setSuperAdminData(stored.superAdminData);
      setStudentData(stored.studentData);
      setBooting(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (booting) {
      return;
    }

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        session,
        libraryData,
        superAdminData,
        studentData,
      })
    ).catch(() => {});
  }, [booting, libraryData, session, studentData, superAdminData]);

  useEffect(() => {
    setAuthToken(session?.token || "");
  }, [session]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const login = useCallback(async (role: "librarian" | "student" | "super_admin", email: string, password: string) => {
    const path = role === "student" ? "/auth/students/login" : role === "super_admin" ? "/auth/super-admin/login" : "/auth/login";
    const data = await apiRequest(path, {
      method: "POST",
      body: { email, password },
    });

    setAuthError("");

    if (role === "student") {
      const nextSession: Session = {
        role: "student",
        studentId: data.session.studentId,
        libraryId: data.session.libraryId,
        name: data.student.name,
        email,
        token: data.token,
      };
      setAuthToken(nextSession.token || "");
      setSession(nextSession);
      setStudentData(null);
      setLibraryData(null);
      return nextSession;
    }

    if (role === "super_admin") {
      const nextSession: Session = {
        role: "super_admin",
        superAdminId: data.session.superAdminId,
        name: data.superAdmin.name,
        email,
        token: data.token,
      };
      setAuthToken(nextSession.token || "");
      setSession(nextSession);
      setSuperAdminData(null);
      setLibraryData(null);
      setStudentData(null);
      return nextSession;
    }

    const nextSession: Session = {
      role: data.session.role,
      libraryId: data.session.libraryId,
      librarianId: data.session.librarianId,
      name: data.librarian.name,
      email,
      token: data.token,
    };
    setAuthToken(nextSession.token || "");
    setSession(nextSession);
    setLibraryData(null);
    setSuperAdminData(null);
    setStudentData(null);
    return nextSession;
  }, []);

  const refreshLibraryData = useCallback(async () => {
    if (!session?.libraryId) {
      return null;
    }

    const dashboard = await apiRequest(`/auth/libraries/${session.libraryId}/dashboard`);
    const result = { ...dashboard, _fetchedAt: Date.now() };
    setLibraryData(result);
    return result;
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

  const createStudent = useCallback(async (formData: FormData) => {
    return apiRequest(`/auth/libraries/${session?.libraryId}/students`, {
      method: "POST",
      body: formData,
    });
  }, [session?.libraryId]);

  const createLibraryAccount = useCallback(async (payload: { name: string; email: string; password: string; libraryName: string; location?: string; latitude?: string | number; longitude?: string | number }) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: payload,
    });

    if (session?.role === "super_admin") {
      refreshSuperAdminData().catch(() => {});
    }

    return data;
  }, [refreshSuperAdminData, session?.role]);

  const markPaymentPaid = useCallback(async (paymentId: string) => {
    return apiRequest(`/auth/libraries/${session?.libraryId}/payments/${paymentId}/mark-paid`, {
      method: "POST",
    });
  }, [session?.libraryId]);

  const changeStudentPassword = useCallback(async (password: string, studentId = session?.studentId) => {
    const data = await apiRequest(`/auth/libraries/${session?.libraryId}/students/${studentId}/change-password`, {
      method: "POST",
      body: { password },
    });
    setStudentData(data.dashboard);
    return data;
  }, [session?.libraryId, session?.studentId]);

  const fetchChatMessages = useCallback(async () => {
    if (!session?.libraryId) {
      return [];
    }

    const data = await apiRequest(`/auth/libraries/${session.libraryId}/chat`);
    return data.items || [];
  }, [session?.libraryId]);

  const fetchStudents = useCallback(async (options: { page?: number; limit?: number; search?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.search) params.set("search", String(options.search));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${session?.libraryId}/students${query ? `?${query}` : ""}`);
  }, [session?.libraryId]);

  const fetchStudentById = useCallback(async (studentId: string) => {
    return apiRequest(`/auth/libraries/${session?.libraryId}/students/${studentId}`);
  }, [session?.libraryId]);

  const updateStudent = useCallback(async (studentId: string, formData: FormData) => {
    return apiRequest(`/auth/libraries/${session?.libraryId}/students/${studentId}`, {
      method: "PATCH",
      body: formData,
    });
  }, [session?.libraryId]);

  const fetchSuperAdminLibrary = useCallback(async (libraryId: string) => {
    return apiRequest(`/auth/super-admin/libraries/${libraryId}`);
  }, []);

  const fetchAnalytics = useCallback(async (period = "6m") => {
    return apiRequest(`/auth/libraries/${session?.libraryId}/analytics?period=${encodeURIComponent(period)}`);
  }, [session?.libraryId]);

  const seedAnalyticsDemo = useCallback(async () => {
    return apiRequest(`/auth/libraries/${session?.libraryId}/analytics/seed-demo`, { method: "POST" });
  }, [session?.libraryId]);

  const fetchAttendanceQrToken = useCallback(async () => {
    return apiRequest(`/auth/libraries/${session?.libraryId}/attendance/qr-token`);
  }, [session?.libraryId]);

  const sendChatMessage = useCallback(async ({ message, tag = "", attachment = null }: { message: string; tag?: string; attachment?: { uri: string; name: string; mimeType?: string } | null }) => {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("tag", tag);
    if (attachment?.uri) {
      formData.append("attachment", {
        uri: attachment.uri,
        name: attachment.name || "attachment",
        type: attachment.mimeType || "application/octet-stream",
      } as any);
    }

    return apiRequest(`/auth/libraries/${session?.libraryId}/chat`, {
      method: "POST",
      body: formData,
    });
  }, [session?.libraryId]);

  const updateChatAccess = useCallback(async (participantType: string, participantId: string, chatEnabled: boolean) => {
    return apiRequest(
      `/auth/libraries/${session?.libraryId}/chat/access/${participantType}/${participantId}`,
      {
        method: "PATCH",
        body: { chatEnabled },
      }
    );
  }, [session?.libraryId]);

  const scanAttendanceQr = useCallback(async (token: string) => {
    const data = await apiRequest(`/auth/libraries/${session?.libraryId}/attendance/scan`, {
      method: "POST",
      body: { token },
    });
    setStudentData(data.dashboard);
    return data;
  }, [session?.libraryId]);

  const assignSeat = useCallback(async (seatId: string, phone: string) => {
    const data = await apiRequest(`/auth/libraries/${session?.libraryId}/seats/${seatId}/assign`, {
      method: "POST",
      body: { phone },
    });
    await refreshLibraryData();
    return data;
  }, [session?.libraryId, refreshLibraryData]);

  const autoFreeSeat = useCallback(async () => {
    const data = await apiRequest(`/auth/libraries/${session?.libraryId}/students/${session?.studentId}/auto-free-seat`, {
      method: "POST",
    });
    await refreshStudentData(session?.studentId);
    return data;
  }, [session?.libraryId, session?.studentId, refreshStudentData]);

  const requestSeatChange = useCallback(async (seatNumber: string, reason: string) => {
    const data = await apiRequest(`/auth/libraries/${session?.libraryId}/students/${session?.studentId}/seat-change-request`, {
      method: "POST",
      body: { seatNumber, reason },
    });
    return data;
  }, [session?.libraryId, session?.studentId]);

  const resolveSeatChangeRequest = useCallback(async (requestId: string, action: string) => {
    const data = await apiRequest(`/auth/libraries/${session?.libraryId}/seat-change-requests/${requestId}/resolve`, {
      method: "POST",
      body: { action },
    });
    await refreshLibraryData();
    return data;
  }, [session?.libraryId, refreshLibraryData]);

  const subscribeToLibraryEvents = useCallback((handlers: {
    onAccessUpdate?: (payload: any) => void;
    onMessage?: (payload: any) => void;
    onSeatChangeRequest?: (payload: any) => void;
    onSeatChangeResolved?: (payload: any) => void;
  } = {}) => {
    if (!session?.libraryId) {
      return () => {};
    }

    if (!socketRef.current) {
      socketRef.current = io(API_ORIGIN, {
        transports: ["websocket"],
        reconnectionAttempts: 5,
      });
    }

    const socket = socketRef.current;
    socket.emit("library:join", session.libraryId);

    const messageHandler = (payload: any) => handlers.onMessage?.(payload);
    const accessHandler = (payload: any) => handlers.onAccessUpdate?.(payload);
    const seatRequestHandler = (payload: any) => handlers.onSeatChangeRequest?.(payload);
    const seatChangeResolvedHandler = (payload: any) => handlers.onSeatChangeResolved?.(payload);

    socket.on("chat:message", messageHandler);
    socket.on("chat:access-updated", accessHandler);
    socket.on("seat:change-request", seatRequestHandler);
    socket.on("seat:change-resolved", seatChangeResolvedHandler);

    return () => {
      socket.off("chat:message", messageHandler);
      socket.off("chat:access-updated", accessHandler);
      socket.off("seat:change-request", seatRequestHandler);
      socket.off("seat:change-resolved", seatChangeResolvedHandler);
      socket.emit("library:leave", session.libraryId);
    };
  }, [session?.libraryId]);

  const logout = useCallback(async () => {
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
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, [session?.libraryId]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if ((session.role === "admin" || session.role === "librarian") && !libraryData) {
      refreshLibraryData().catch(() => {});
    }

    if (session.role === "super_admin" && !superAdminData) {
      refreshSuperAdminData().catch(() => {});
    }

    if (session.role === "student" && !studentData && session.studentId) {
      refreshStudentData(session.studentId).catch(() => {});
    }
  }, [libraryData, refreshLibraryData, refreshStudentData, refreshSuperAdminData, session, studentData, superAdminData]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authError,
      booting,
      changeStudentPassword,
      createLibraryAccount,
      createStudent,
      fetchAnalytics,
      fetchAttendanceQrToken,
      fetchStudentById,
      fetchStudents,
      fetchSuperAdminLibrary,
      fetchChatMessages,
      libraryData,
      login,
      logout,
      markPaymentPaid,
      refreshLibraryData,
      refreshSuperAdminData,
      refreshStudentData,
      assignSeat,
      autoFreeSeat,
      requestSeatChange,
      resolveSeatChangeRequest,
      session,
      setAuthError,
      sendChatMessage,
      scanAttendanceQr,
      subscribeToLibraryEvents,
      superAdminData,
      studentData,
      seedAnalyticsDemo,
      updateChatAccess,
      updateStudent,
    }),
    [
      assignSeat,
      authError,
      booting,
      changeStudentPassword,
      createLibraryAccount,
      createStudent,
      fetchAnalytics,
      fetchAttendanceQrToken,
      fetchStudentById,
      fetchStudents,
      fetchSuperAdminLibrary,
      fetchChatMessages,
      libraryData,
      login,
      logout,
      markPaymentPaid,
      refreshLibraryData,
      refreshSuperAdminData,
      refreshStudentData,
      requestSeatChange,
      session,
      sendChatMessage,
      scanAttendanceQr,
      subscribeToLibraryEvents,
      superAdminData,
      studentData,
      seedAnalyticsDemo,
      updateChatAccess,
      updateStudent,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
