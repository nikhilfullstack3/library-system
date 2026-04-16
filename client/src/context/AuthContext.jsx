import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_ORIGIN, apiRequest, setAuthToken } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "library-app-session";

function loadStoredState() {
  if (typeof window === "undefined") {
    return { libraryData: null, session: null, superAdminData: null, studentData: null };
  }
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || { session: null };
    if (stored.session && !stored.session.token) {
      return { libraryData: null, session: null, superAdminData: null, studentData: null };
    }
    return { libraryData: null, session: stored.session || null, superAdminData: null, studentData: null };
  } catch {
    return { libraryData: null, session: null, superAdminData: null, studentData: null };
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

  // Stable identifiers extracted so callbacks only re-create on login/logout
  const libraryId = session?.libraryId ?? null;
  const studentSelf = session?.studentId ?? null;

  // ─── Stable callbacks ───────────────────────────────────────────────────────

  const applyChatAccessUpdate = useCallback((payload = {}) => {
    const participant = payload.participant || payload;
    const participantId = String(participant.id || "");
    const participantType = participant.participantType;
    if (!participantId) return;

    setLibraryData((current) => {
      if (!current) return current;
      const listKey = participantType === "student" ? "students" : "librarians";
      const currentList = Array.isArray(current[listKey]) ? current[listKey] : null;
      if (!currentList) return current;
      let changed = false;
      const nextList = currentList.map((item) => {
        if (String(item.id) !== participantId) return item;
        changed = true;
        return { ...item, chatEnabled: Boolean(participant.chatEnabled) };
      });
      return changed ? { ...current, [listKey]: nextList } : current;
    });

    if (participantType === "student") {
      setStudentData((current) => {
        if (!current?.student || String(current.student.id) !== participantId) return current;
        return { ...current, student: { ...current.student, chatEnabled: Boolean(participant.chatEnabled) } };
      });
    }
  }, []);

  const refreshLibraryData = useCallback(async () => {
    if (!libraryId) return null;
    const dashboard = await apiRequest(`/auth/libraries/${libraryId}/dashboard`);
    const result = { ...dashboard, _fetchedAt: Date.now() };
    setLibraryData(result);
    return result;
  }, [libraryId]);

  const refreshSuperAdminData = useCallback(async (location = "") => {
    if (session?.role !== "super_admin") return null;
    const query = location ? `?location=${encodeURIComponent(location)}` : "";
    const dashboard = await apiRequest(`/auth/super-admin/dashboard${query}`);
    setSuperAdminData(dashboard);
    return dashboard;
  }, [session?.role]);

  const refreshStudentData = useCallback(async (studentId = studentSelf) => {
    if (!libraryId || !studentId) return null;
    const dashboard = await apiRequest(`/auth/libraries/${libraryId}/students/${studentId}/dashboard`);
    setStudentData(dashboard);
    return dashboard;
  }, [libraryId, studentSelf]);

  // ─── Session persistence ─────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ session }));
  }, [session]);

  useEffect(() => {
    setAuthToken(session?.token || "");
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if ((session.role === "admin" || session.role === "librarian") && !libraryData) refreshLibraryData();
    if (session.role === "super_admin" && !superAdminData) refreshSuperAdminData();
    if (session.role === "student" && !studentData && session.studentId) refreshStudentData(session.studentId);
  }, [libraryData, refreshLibraryData, refreshStudentData, refreshSuperAdminData, session, studentData, superAdminData]);

  // ─── Always-on presence listener ─────────────────────────────────────────────
  // Patches libraryData.seats whenever a student checks in/out, regardless of
  // which page is mounted. Must be context-level so SeatsPage always sees updates.

  useEffect(() => {
    if (!libraryId) return undefined;

    if (!socketRef.current) {
      socketRef.current = io(API_ORIGIN, { transports: ["websocket", "polling"] });
    }

    const socket = socketRef.current;
    socket.emit("library:join", libraryId);

    const presenceHandler = (updatedSeat) => {
      setLibraryData((current) => {
        if (!current?.seats) return current;
        return {
          ...current,
          seats: current.seats.map((s) =>
            String(s.id) === String(updatedSeat.id) ? updatedSeat : s
          ),
        };
      });
    };

    socket.on("seat:presence-updated", presenceHandler);
    return () => { socket.off("seat:presence-updated", presenceHandler); };
  }, [libraryId]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // ─── Auth ─────────────────────────────────────────────────────────────────────

  const login = useCallback(async (role, email, password) => {
    const path = role === "student" ? "/auth/students/login" : role === "super_admin" ? "/auth/super-admin/login" : "/auth/login";
    const data = await apiRequest(path, { method: "POST", body: { email, password } });
    setAuthError("");

    if (role === "student") {
      const nextSession = { role: "student", studentId: data.session.studentId, libraryId: data.session.libraryId, name: data.student.name, email, token: data.token };
      setAuthToken(nextSession.token || "");
      setSession(nextSession);
      setStudentData(null);
      setLibraryData(null);
      return nextSession;
    }

    if (role === "super_admin") {
      const nextSession = { role: "super_admin", superAdminId: data.session.superAdminId, name: data.superAdmin.name, email: data.superAdmin.email, token: data.token };
      setAuthToken(nextSession.token || "");
      setSession(nextSession);
      setSuperAdminData(null);
      setLibraryData(null);
      setStudentData(null);
      return nextSession;
    }

    const nextSession = { role: data.session.role, libraryId: data.session.libraryId, librarianId: data.session.librarianId, name: data.librarian.name, email, token: data.token };
    setAuthToken(nextSession.token || "");
    setSession(nextSession);
    setLibraryData(null);
    setSuperAdminData(null);
    setStudentData(null);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("library:leave", socketRef.current._libraryId);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSession(null);
    setLibraryData(null);
    setSuperAdminData(null);
    setStudentData(null);
    setAuthError("");
    setAuthToken("");
    if (typeof window !== "undefined") window.sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // ─── Data fetchers (stable — only change when libraryId changes) ──────────────

  const fetchSuperAdminLibrary = useCallback((id) => {
    return apiRequest(`/auth/super-admin/libraries/${id}`);
  }, []);

  const updateStudentProfile = useCallback(async (formData, studentId = studentSelf) => {
    const data = await apiRequest(`/auth/libraries/${libraryId}/students/${studentId}/profile`, { method: "PATCH", body: formData });
    setStudentData(data.dashboard);
    return data;
  }, [libraryId, studentSelf]);

  const changeStudentPassword = useCallback(async (password, studentId = studentSelf) => {
    const data = await apiRequest(`/auth/libraries/${libraryId}/students/${studentId}/change-password`, { method: "POST", body: { password } });
    setStudentData(data.dashboard);
    return data;
  }, [libraryId, studentSelf]);

  const createStudent = useCallback((formData) => {
    return apiRequest(`/auth/libraries/${libraryId}/students`, { method: "POST", body: formData });
  }, [libraryId]);

  const createLibraryAccount = useCallback(async (payload) => {
    const data = await apiRequest("/auth/register", { method: "POST", body: payload });
    if (session?.role === "super_admin") refreshSuperAdminData().catch(() => {});
    return data;
  }, [refreshSuperAdminData, session?.role]);

  const updateStudent = useCallback((studentId, formData) => {
    return apiRequest(`/auth/libraries/${libraryId}/students/${studentId}`, { method: "PATCH", body: formData });
  }, [libraryId]);

  const updateStudentDocumentVerification = useCallback((studentId, verified) => {
    return apiRequest(`/auth/libraries/${libraryId}/students/${studentId}/document-verification`, { method: "PATCH", body: { verified } });
  }, [libraryId]);

  const deleteStudent = useCallback((studentId) => {
    return apiRequest(`/auth/libraries/${libraryId}/students/${studentId}`, { method: "DELETE" });
  }, [libraryId]);

  const markPresent = useCallback((studentId) => {
    return apiRequest(`/auth/libraries/${libraryId}/attendance/mark-present`, { method: "POST", body: { studentId } });
  }, [libraryId]);

  const fetchAttendanceQrToken = useCallback(() => {
    return apiRequest(`/auth/libraries/${libraryId}/attendance/qr-token`);
  }, [libraryId]);

  const scanAttendanceQr = useCallback(async (token, studentId = studentSelf) => {
    const data = await apiRequest(`/auth/libraries/${libraryId}/attendance/scan`, { method: "POST", body: { token } });
    if (studentId) setStudentData(data.dashboard);
    return data;
  }, [libraryId, studentSelf]);

  const assignSeat = useCallback(async (seatId, phone) => {
    const data = await apiRequest(`/auth/libraries/${libraryId}/seats/${seatId}/assign`, { method: "POST", body: { phone } });
    await refreshLibraryData();
    return data;
  }, [libraryId, refreshLibraryData]);

  const markPaymentPaid = useCallback((paymentId) => {
    return apiRequest(`/auth/libraries/${libraryId}/payments/${paymentId}/mark-paid`, { method: "POST" });
  }, [libraryId]);

  const createLibrarian = useCallback((payload) => {
    return apiRequest(`/auth/libraries/${libraryId}/librarians`, { method: "POST", body: payload });
  }, [libraryId]);

  const fetchChatMessages = useCallback(async () => {
    if (!libraryId) return [];
    const data = await apiRequest(`/auth/libraries/${libraryId}/chat`);
    return data.items || [];
  }, [libraryId]);

  const fetchStudents = useCallback((options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.search) params.set("search", String(options.search));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${libraryId}/students${query ? `?${query}` : ""}`);
  }, [libraryId]);

  const fetchStudentById = useCallback((studentId) => {
    return apiRequest(`/auth/libraries/${libraryId}/students/${studentId}`);
  }, [libraryId]);

  const fetchAttendance = useCallback((options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.dateKey) params.set("dateKey", String(options.dateKey));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${libraryId}/attendance${query ? `?${query}` : ""}`);
  }, [libraryId]);

  const fetchPayments = useCallback((options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.status) params.set("status", String(options.status));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${libraryId}/payments${query ? `?${query}` : ""}`);
  }, [libraryId]);

  const fetchAnalytics = useCallback((period = "6m") => {
    return apiRequest(`/auth/libraries/${libraryId}/analytics?period=${encodeURIComponent(period)}`);
  }, [libraryId]);

  const seedAnalyticsDemo = useCallback(() => {
    return apiRequest(`/auth/libraries/${libraryId}/analytics/seed-demo`, { method: "POST" });
  }, [libraryId]);

  const fetchDailyReport = useCallback(() => {
    return apiRequest(`/auth/libraries/${libraryId}/reports/daily`);
  }, [libraryId]);

  const fetchMonthlyReport = useCallback(() => {
    return apiRequest(`/auth/libraries/${libraryId}/reports/monthly`);
  }, [libraryId]);

  const fetchDocuments = useCallback((options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.status) params.set("status", String(options.status));
    const query = params.toString();
    return apiRequest(`/auth/libraries/${libraryId}/documents${query ? `?${query}` : ""}`);
  }, [libraryId]);

  const sendChatMessage = useCallback(({ attachment, message, tag }) => {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("tag", tag || "");
    if (attachment) formData.append("attachment", attachment);
    return apiRequest(`/auth/libraries/${libraryId}/chat`, { method: "POST", body: formData });
  }, [libraryId]);

  const updateChatAccess = useCallback(async (participantType, participantId, chatEnabled) => {
    const data = await apiRequest(
      `/auth/libraries/${libraryId}/chat/access/${participantType}/${participantId}`,
      { method: "PATCH", body: { chatEnabled } }
    );
    applyChatAccessUpdate({ participant: { id: participantId, participantType, chatEnabled } });
    return data;
  }, [libraryId, applyChatAccessUpdate]);

  const requestSeatChange = useCallback((seatNumber, reason) => {
    return apiRequest(
      `/auth/libraries/${libraryId}/students/${studentSelf}/seat-change-request`,
      { method: "POST", body: { seatNumber, reason } }
    );
  }, [libraryId, studentSelf]);

  const resolveSeatChangeRequest = useCallback(async (requestId, action) => {
    const data = await apiRequest(
      `/auth/libraries/${libraryId}/seat-change-requests/${requestId}/resolve`,
      { method: "POST", body: { action } }
    );
    await refreshLibraryData();
    return data;
  }, [libraryId, refreshLibraryData]);

  const subscribeToLibraryEvents = useCallback((handlers = {}) => {
    if (!libraryId) return () => {};

    if (!socketRef.current) {
      socketRef.current = io(API_ORIGIN, { transports: ["websocket", "polling"] });
    }

    const socket = socketRef.current;
    socket.emit("library:join", libraryId);

    const messageHandler = (payload) => handlers.onMessage?.(payload);
    const accessHandler = (payload) => {
      applyChatAccessUpdate(payload);
      handlers.onAccessUpdate?.(payload);
    };
    const seatRequestHandler = (payload) => handlers.onSeatChangeRequest?.(payload);
    const seatResolvedHandler = (payload) => handlers.onSeatChangeResolved?.(payload);

    socket.on("chat:message", messageHandler);
    socket.on("chat:access-updated", accessHandler);
    socket.on("seat:change-request", seatRequestHandler);
    socket.on("seat:change-resolved", seatResolvedHandler);

    return () => {
      socket.off("chat:message", messageHandler);
      socket.off("chat:access-updated", accessHandler);
      socket.off("seat:change-request", seatRequestHandler);
      socket.off("seat:change-resolved", seatResolvedHandler);
      socket.emit("library:leave", libraryId);
    };
  }, [libraryId, applyChatAccessUpdate]);

  // ─── Context value ────────────────────────────────────────────────────────────
  // All functions are now useCallback — they only change identity on login/logout,
  // not on every libraryData update. This prevents spurious page refetches.

  const value = useMemo(() => ({
    assignSeat,
    authError,
    changeStudentPassword,
    createLibrarian,
    createLibraryAccount,
    createStudent,
    deleteStudent,
    fetchAnalytics,
    fetchAttendance,
    fetchAttendanceQrToken,
    fetchChatMessages,
    fetchDailyReport,
    fetchDocuments,
    fetchMonthlyReport,
    fetchPayments,
    fetchStudentById,
    fetchStudents,
    fetchSuperAdminLibrary,
    libraryData,
    login,
    logout,
    markPaymentPaid,
    markPresent,
    refreshLibraryData,
    refreshSuperAdminData,
    refreshStudentData,
    requestSeatChange,
    resolveSeatChangeRequest,
    scanAttendanceQr,
    seedAnalyticsDemo,
    sendChatMessage,
    session,
    setAuthError,
    studentData,
    subscribeToLibraryEvents,
    superAdminData,
    updateChatAccess,
    updateStudent,
    updateStudentDocumentVerification,
    updateStudentProfile,
  }), [
    assignSeat, authError, changeStudentPassword, createLibrarian, createLibraryAccount,
    createStudent, deleteStudent, fetchAnalytics, fetchAttendance, fetchAttendanceQrToken,
    fetchChatMessages, fetchDailyReport, fetchDocuments, fetchMonthlyReport, fetchPayments,
    fetchStudentById, fetchStudents, fetchSuperAdminLibrary, libraryData, login, logout,
    markPaymentPaid, markPresent, refreshLibraryData, refreshSuperAdminData, refreshStudentData,
    requestSeatChange, resolveSeatChangeRequest, scanAttendanceQr, seedAnalyticsDemo,
    sendChatMessage, session, studentData, subscribeToLibraryEvents, superAdminData,
    updateChatAccess, updateStudent, updateStudentDocumentVerification, updateStudentProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
