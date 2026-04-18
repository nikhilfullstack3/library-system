import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardShell } from "./components/layout/DashboardShell";
import { SuperAdminShell } from "./components/layout/SuperAdminShell";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const AttendancePage = lazy(() => import("./pages/librarian/AttendancePage").then((module) => ({ default: module.AttendancePage })));
const DashboardPage = lazy(() => import("./pages/librarian/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const AnalyticsPage = lazy(() => import("./pages/librarian/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })));
const DocumentsPage = lazy(() => import("./pages/librarian/DocumentsPage").then((module) => ({ default: module.DocumentsPage })));
const PaymentsPage = lazy(() => import("./pages/librarian/PaymentsPage").then((module) => ({ default: module.PaymentsPage })));
const RegistrationPage = lazy(() => import("./pages/librarian/RegistrationPage").then((module) => ({ default: module.RegistrationPage })));
const SeatsPage = lazy(() => import("./pages/librarian/SeatsPage").then((module) => ({ default: module.SeatsPage })));
const StudentsPage = lazy(() => import("./pages/librarian/StudentsPage").then((module) => ({ default: module.StudentsPage })));
const StudentDetailPage = lazy(() => import("./pages/librarian/StudentDetailPage").then((module) => ({ default: module.StudentDetailPage })));
const ChatPage = lazy(() => import("./pages/librarian/ChatPage").then((module) => ({ default: module.ChatPage })));
const SuperAdminLoginPage = lazy(() => import("./pages/super-admin/SuperAdminLoginPage").then((module) => ({ default: module.SuperAdminLoginPage })));
const SuperAdminDashboardPage = lazy(() => import("./pages/super-admin/SuperAdminDashboardPage").then((module) => ({ default: module.SuperAdminDashboardPage })));
const SuperAdminLibraryPage = lazy(() => import("./pages/super-admin/SuperAdminLibraryPage").then((module) => ({ default: module.SuperAdminLibraryPage })));
const SuperAdminRegistrationPage = lazy(() => import("./pages/super-admin/SuperAdminRegistrationPage").then((module) => ({ default: module.SuperAdminRegistrationPage })));
const StudentDashboardPage = lazy(() => import("./pages/student/StudentDashboardPage").then((module) => ({ default: module.StudentDashboardPage })));
const StudentProfilePage = lazy(() => import("./pages/student/StudentProfilePage").then((module) => ({ default: module.StudentProfilePage })));
const TermsPage = lazy(() => import("./pages/TermsPage").then((module) => ({ default: module.TermsPage })));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage").then((module) => ({ default: module.PrivacyPolicyPage })));
const LibrarySignupPage = lazy(() => import("./pages/LibrarySignupPage").then((module) => ({ default: module.LibrarySignupPage })));

function ProtectedRoute({ allow, children }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (allow && !allow.includes(session.role)) {
    return <Navigate replace to={session.role === "student" ? "/student" : session.role === "super_admin" ? "/super-admin" : "/librarian"} />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route element={<Navigate replace to="/login" />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<SuperAdminLoginPage />} path="/sa-login" />

        <Route
          element={
            <ProtectedRoute allow={["admin", "librarian"]}>
              <DashboardShell />
            </ProtectedRoute>
          }
          path="/librarian"
        >
          <Route element={<DashboardPage />} index />
          <Route element={<AnalyticsPage />} path="analytics" />
          <Route element={<StudentsPage />} path="students" />
          <Route element={<StudentDetailPage />} path="students/:studentId" />
          <Route element={<RegistrationPage />} path="registration" />
          <Route element={<SeatsPage />} path="seats" />
          <Route element={<AttendancePage />} path="attendance" />
          <Route element={<PaymentsPage />} path="payments" />
          <Route element={<DocumentsPage />} path="documents" />
          <Route element={<ChatPage />} path="chat" />
        </Route>

        <Route
          element={
            <ProtectedRoute allow={["super_admin"]}>
              <SuperAdminShell />
            </ProtectedRoute>
          }
          path="/super-admin"
        >
          <Route element={<SuperAdminDashboardPage />} index />
          <Route element={<SuperAdminRegistrationPage />} path="registration" />
          <Route element={<SuperAdminLibraryPage />} path="libraries/:libraryId" />
        </Route>

        <Route
          element={
            <ProtectedRoute allow={["student"]}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
          path="/student"
        />
        <Route
          element={
            <ProtectedRoute allow={["student"]}>
              <StudentProfilePage />
            </ProtectedRoute>
          }
          path="/student/profile"
        />

        <Route element={<TermsPage />} path="/terms" />
        <Route element={<PrivacyPolicyPage />} path="/privacy" />
        <Route element={<LibrarySignupPage />} path="/signup" />
        <Route element={<Navigate replace to="/login" />} path="*" />
      </Routes>
    </Suspense>
  );
}

function RouteLoader() {
  return <div className="min-h-screen bg-slate-50 transition-colors duration-300" />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
