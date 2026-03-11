import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardShell } from "./components/layout/DashboardShell";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { AttendancePage } from "./pages/librarian/AttendancePage";
import { DashboardPage } from "./pages/librarian/DashboardPage";
import { DocumentsPage } from "./pages/librarian/DocumentsPage";
import { PaymentsPage } from "./pages/librarian/PaymentsPage";
import { SeatsPage } from "./pages/librarian/SeatsPage";
import { StudentsPage } from "./pages/librarian/StudentsPage";
import { ChatPage } from "./pages/librarian/ChatPage";
import { StudentDashboardPage } from "./pages/student/StudentDashboardPage";
import { StudentProfilePage } from "./pages/student/StudentProfilePage";

function ProtectedRoute({ allow, children }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (allow && !allow.includes(session.role)) {
    return <Navigate replace to={session.role === "student" ? "/student" : "/librarian"} />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/login" />} path="/" />
      <Route element={<LoginPage />} path="/login" />

      <Route
        element={
          <ProtectedRoute allow={["admin", "librarian"]}>
            <DashboardShell />
          </ProtectedRoute>
        }
        path="/librarian"
      >
        <Route element={<DashboardPage />} index />
        <Route element={<StudentsPage />} path="students" />
        <Route element={<SeatsPage />} path="seats" />
        <Route element={<AttendancePage />} path="attendance" />
        <Route element={<PaymentsPage />} path="payments" />
        <Route element={<DocumentsPage />} path="documents" />
        <Route element={<ChatPage />} path="chat" />
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

      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
