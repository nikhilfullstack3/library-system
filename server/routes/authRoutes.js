const express = require("express");
const multer = require("multer");
const { registerLibrary, getLibraries } = require("../controllers/authControllers");
const {
  deleteStudent,
  changeStudentPassword,
  getAttendance,
  getChatMessages,
  getDocuments,
  getLibraryDashboard,
  getPayments,
  getSeats,
  getStudentById,
  getStudentDashboardHandler,
  getStudents,
  markPaymentPaid,
  markPresent,
  postChatMessage,
  registerLibrarian,
  registerStudent,
  updateStudentProfile,
  updateChatAccess,
  updateStudent,
} = require("../controllers/dashboardControllers");
const { loginLibrarian, loginStudent } = require("../controllers/loginControllers");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/register", registerLibrary);
router.post("/login", loginLibrarian);
router.post("/students/login", loginStudent);
router.get("/libraries", getLibraries);
router.get("/libraries/:libraryId/dashboard", getLibraryDashboard);
router.get("/libraries/:libraryId/students", getStudents);
router.get("/libraries/:libraryId/students/:studentId", getStudentById);
router.get("/libraries/:libraryId/students/:studentId/dashboard", getStudentDashboardHandler);
router.patch(
  "/libraries/:libraryId/students/:studentId/profile",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  updateStudentProfile
);
router.post("/libraries/:libraryId/students/:studentId/change-password", changeStudentPassword);
router.post("/libraries/:libraryId/students", upload.single("document"), registerStudent);
router.patch("/libraries/:libraryId/students/:studentId", upload.single("document"), updateStudent);
router.delete("/libraries/:libraryId/students/:studentId", deleteStudent);
router.get("/libraries/:libraryId/seats", getSeats);
router.get("/libraries/:libraryId/attendance", getAttendance);
router.post("/libraries/:libraryId/attendance/mark-present", markPresent);
router.get("/libraries/:libraryId/payments", getPayments);
router.post("/libraries/:libraryId/payments/:paymentId/mark-paid", markPaymentPaid);
router.get("/libraries/:libraryId/documents", getDocuments);
router.get("/libraries/:libraryId/chat", getChatMessages);
router.post("/libraries/:libraryId/chat", upload.single("attachment"), postChatMessage);
router.patch("/libraries/:libraryId/chat/access/:participantType/:participantId", updateChatAccess);
router.post("/libraries/:libraryId/librarians", registerLibrarian);

router.post("/students/register", upload.single("document"), registerStudent);
router.post("/librarians/register", registerLibrarian);

module.exports = router;
