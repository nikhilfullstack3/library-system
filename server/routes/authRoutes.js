const express = require("express");
const multer = require("multer");
const { registerLibrary, getLibraries } = require("../controllers/authControllers");
const {
  deleteStudent,
  changeStudentPassword,
  getAttendance,
  getAttendanceQrToken,
  getChatMessages,
  getDocuments,
  getLibraryDashboard,
  getPayments,
  getSeats,
  getSuperAdminDashboard,
  getSuperAdminLibraryView,
  getStudentById,
  getStudentDashboardHandler,
  getStudents,
  markPaymentPaid,
  markPresent,
  postChatMessage,
  scanAttendanceQr,
  registerLibrarian,
  registerStudent,
  updateStudentProfile,
  updateChatAccess,
  updateStudentDocumentVerification,
  updateStudent,
} = require("../controllers/dashboardControllers");
const { loginLibrarian, loginStudent, loginSuperAdmin } = require("../controllers/loginControllers");
const { requireAuth, requireRole, requireStudentSelf } = require("../middleware/auth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/register", registerLibrary);
router.post("/login", loginLibrarian);
router.post("/super-admin/login", loginSuperAdmin);
router.post("/students/login", loginStudent);
router.get("/libraries", getLibraries);
router.get("/super-admin/dashboard", requireAuth, requireRole("super_admin"), getSuperAdminDashboard);
router.get("/super-admin/libraries/:libraryId", requireAuth, requireRole("super_admin"), getSuperAdminLibraryView);
router.get("/libraries/:libraryId/dashboard", requireAuth, requireRole("admin", "librarian", "super_admin"), getLibraryDashboard);
router.get("/libraries/:libraryId/students", requireAuth, requireRole("admin", "librarian", "super_admin"), getStudents);
router.get("/libraries/:libraryId/students/:studentId", requireAuth, requireRole("admin", "librarian", "super_admin"), getStudentById);
router.get("/libraries/:libraryId/students/:studentId/dashboard", requireAuth, getStudentDashboardHandler);
router.patch(
  "/libraries/:libraryId/students/:studentId/profile",
  requireAuth,
  requireStudentSelf,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  updateStudentProfile
);
router.post("/libraries/:libraryId/students/:studentId/change-password", requireAuth, requireStudentSelf, changeStudentPassword);
router.post("/libraries/:libraryId/students", requireAuth, requireRole("admin", "librarian", "super_admin"), upload.array("documents", 5), registerStudent);
router.patch(
  "/libraries/:libraryId/students/:studentId/document-verification",
  requireAuth,
  requireRole("admin", "librarian", "super_admin"),
  updateStudentDocumentVerification
);
router.patch("/libraries/:libraryId/students/:studentId", requireAuth, requireRole("admin", "librarian", "super_admin"), upload.single("document"), updateStudent);
router.delete("/libraries/:libraryId/students/:studentId", requireAuth, requireRole("admin", "librarian", "super_admin"), deleteStudent);
router.get("/libraries/:libraryId/seats", requireAuth, requireRole("admin", "librarian", "super_admin"), getSeats);
router.get("/libraries/:libraryId/attendance", requireAuth, requireRole("admin", "librarian", "super_admin"), getAttendance);
router.get("/libraries/:libraryId/attendance/qr-token", requireAuth, requireRole("admin", "librarian", "super_admin"), getAttendanceQrToken);
router.post("/libraries/:libraryId/attendance/mark-present", requireAuth, requireRole("admin", "librarian", "super_admin"), markPresent);
router.post("/libraries/:libraryId/attendance/scan", requireAuth, requireRole("student"), scanAttendanceQr);
router.get("/libraries/:libraryId/payments", requireAuth, requireRole("admin", "librarian", "super_admin"), getPayments);
router.post("/libraries/:libraryId/payments/:paymentId/mark-paid", requireAuth, requireRole("admin", "librarian", "super_admin"), markPaymentPaid);
router.get("/libraries/:libraryId/documents", requireAuth, requireRole("admin", "librarian", "super_admin"), getDocuments);
router.get("/libraries/:libraryId/chat", requireAuth, getChatMessages);
router.post("/libraries/:libraryId/chat", requireAuth, upload.single("attachment"), postChatMessage);
router.patch("/libraries/:libraryId/chat/access/:participantType/:participantId", requireAuth, requireRole("admin", "super_admin"), updateChatAccess);
router.post("/libraries/:libraryId/librarians", requireAuth, requireRole("admin", "super_admin"), registerLibrarian);

router.post("/students/register", requireAuth, requireRole("admin", "librarian", "super_admin"), upload.array("documents", 5), registerStudent);
router.post("/librarians/register", requireAuth, requireRole("admin", "super_admin"), registerLibrarian);

module.exports = router;
