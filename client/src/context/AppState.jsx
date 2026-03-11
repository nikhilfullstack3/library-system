import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { loadStoredAppState, storeAppState } from "../lib/session";

const AppStateContext = createContext(null);

const initialStoredState = loadStoredAppState();

export function AppStateProvider({ children }) {
  const [session, setSession] = useState(initialStoredState.session);
  const [dashboard, setDashboard] = useState(initialStoredState.dashboard);
  const [studentProfile, setStudentProfile] = useState(initialStoredState.studentProfile);
  const [libraries, setLibraries] = useState([]);
  const [librariesLoading, setLibrariesLoading] = useState(true);
  const [librariesError, setLibrariesError] = useState("");

  useEffect(() => {
    storeAppState({ session, dashboard, studentProfile });
  }, [session, dashboard, studentProfile]);

  async function loadLibraries() {
    setLibrariesLoading(true);
    setLibrariesError("");

    try {
      const data = await apiRequest("/auth/libraries");
      setLibraries(Array.isArray(data) ? data : []);
    } catch (error) {
      setLibrariesError(error.message || "Unable to load libraries");
    } finally {
      setLibrariesLoading(false);
    }
  }

  useEffect(() => {
    loadLibraries();
  }, []);

  async function refreshDashboard(libraryId = session?.libraryId) {
    if (!libraryId) {
      return null;
    }

    const data = await apiRequest(`/auth/libraries/${libraryId}/dashboard`);
    setDashboard(data);
    return data;
  }

  async function registerLibrary(payload) {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: payload,
    });

    setSession({
      role: "admin",
      libraryId: data.library._id,
      librarian: data.librarian,
    });
    setDashboard(data.dashboard);
    setStudentProfile(null);
    await loadLibraries();

    return data;
  }

  async function loginStaff(payload) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: payload,
    });

    setSession({
      role: data.session?.role || data.librarian?.role || "librarian",
      libraryId: data.session?.libraryId,
      librarian: data.librarian,
    });
    setDashboard(data.dashboard);
    setStudentProfile(null);

    return data;
  }

  async function loginStudent(payload) {
    const data = await apiRequest("/auth/students/login", {
      method: "POST",
      body: payload,
    });

    setSession({
      role: "student",
      libraryId: data.session.libraryId,
    });
    setStudentProfile(data.student);
    setDashboard(null);

    return data;
  }

  async function createStudent(payload) {
    const data = await apiRequest("/auth/students/register", {
      method: "POST",
      body: {
        ...payload,
        libraryId: session?.libraryId,
      },
    });

    setDashboard(data.dashboard);
    return data;
  }

  async function createLibrarian(payload) {
    const data = await apiRequest("/auth/librarians/register", {
      method: "POST",
      body: {
        ...payload,
        libraryId: session?.libraryId,
      },
    });

    setDashboard(data.dashboard);
    return data;
  }

  function logout() {
    setSession(null);
    setDashboard(null);
    setStudentProfile(null);
  }

  const value = useMemo(
    () => ({
      createLibrarian,
      createStudent,
      dashboard,
      libraries,
      librariesError,
      librariesLoading,
      loadLibraries,
      loginStaff,
      loginStudent,
      logout,
      refreshDashboard,
      registerLibrary,
      session,
      studentProfile,
    }),
    [dashboard, libraries, librariesError, librariesLoading, session, studentProfile]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);

  if (!value) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return value;
}
