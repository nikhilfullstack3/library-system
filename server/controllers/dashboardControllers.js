const mongoose = require("mongoose");
const crypto = require("crypto");
const Attendance = require("../models/Attendance");
const ChatMessage = require("../models/ChatMessage");
const Document = require("../models/Document");
const Library = require("../models/Library");
const Librarian = require("../models/Librarian");
const Payment = require("../models/Payment");
const Seat = require("../models/Seat");
const Student = require("../models/Student");
const SuperAdmin = require("../models/SuperAdmin");
const { hashPassword } = require("../utils/password");
const { emitLibraryEvent } = require("../socket");
const { saveUpload } = require("../services/storage");

const DEFAULT_SEAT_COUNT = 24;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const DASHBOARD_PREVIEW_LIMIT = 12;
const CHAT_MESSAGE_LIMIT = 100;
const QR_SECRET = process.env.QR_SECRET || process.env.SESSION_SECRET || "library-system-qr-secret";

function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getQrPayload(libraryId, dateKey = toDateKey()) {
  const body = `${libraryId}:${dateKey}`;
  const signature = crypto.createHmac("sha256", QR_SECRET).update(body).digest("base64url");
  return `LIBQR.${Buffer.from(body).toString("base64url")}.${signature}`;
}

function verifyQrPayload(token = "", libraryId) {
  const [prefix, encodedBody, signature] = String(token).split(".");
  if (prefix !== "LIBQR" || !encodedBody || !signature) {
    return false;
  }

  const body = Buffer.from(encodedBody, "base64url").toString("utf8");
  const expectedSignature = crypto.createHmac("sha256", QR_SECRET).update(body).digest("base64url");

  if (signature !== expectedSignature) {
    return false;
  }

  const [tokenLibraryId, dateKey] = body.split(":");
  return tokenLibraryId === String(libraryId) && dateKey === toDateKey();
}

function formatMonth(date = new Date()) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getNextPaymentDate() {
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 5);
  return next;
}

function getDefaultShiftTiming(shift = "") {
  const normalizedShift = String(shift || "").trim().toLowerCase();

  if (normalizedShift === "morning") {
    return "8:00 AM - 2:00 PM";
  }

  if (normalizedShift === "evening") {
    return "2:00 PM - 8:00 PM";
  }

  if (normalizedShift === "full day") {
    return "8:00 AM - 8:00 PM";
  }

  return "8:00 AM - 8:00 PM";
}

function formatTime(value) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function parseSeatNumber(value) {
  const digits = String(value || "").match(/\d+/);
  return digits ? Number(digits[0]) : null;
}

function parsePositiveNumber(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(String(value || ""), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
}

function toObjectId(value) {
  return new mongoose.Types.ObjectId(String(value));
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPageOptions(query, defaultLimit = DEFAULT_LIMIT) {
  const page = parsePositiveNumber(query.page, DEFAULT_PAGE);
  const limit = parsePositiveNumber(query.limit, defaultLimit, MAX_LIMIT);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function buildPaginatedResponse(items, page, limit, total) {
  return {
    items,
    pagination: buildPagination(page, limit, total),
  };
}

function buildStudentPayload(student) {
  return {
    id: student._id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    address: student.address,
    profilePhotoName: student.profilePhotoName,
    profilePhotoUrl: student.profilePhotoUrl,
    seatNumber: student.seatNumber,
    joinDate: student.createdAt,
    shift: student.shift,
    shiftTiming: student.shiftTiming,
    shiftStartTime: student.shiftStartTime,
    shiftEndTime: student.shiftEndTime,
    fullDay: student.fullDay,
    paymentStatus: student.paymentStatus,
    paymentMode: student.paymentMode,
    loginId: student.loginId,
    issuedPassword: student.issuedPassword,
    loginEnabled: student.loginEnabled,
    documents: student.documents,
    hoursSpent: student.hoursSpent,
    currentlyInLibrary: student.currentlyInLibrary,
    activeSessionStartedAt: student.activeSessionStartedAt || null,
    currentSessionDuration: student.currentSessionDuration || "",
    chatEnabled: student.chatEnabled,
    createdAt: student.createdAt,
  };
}

function buildShiftTiming(startTime = "", endTime = "", fullDay = false) {
  if (fullDay) {
    return "Full Day";
  }

  if (!startTime && !endTime) {
    return "";
  }

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  return startTime || endTime || "";
}

function generateStudentLoginId(student) {
  const base = String(student.name || "student")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 8);
  return `${base || "student"}${String(student.seatNumber || "").replace(/\D/g, "") || "1"}${String(student._id).slice(-4)}`;
}

function generateStudentPassword() {
  return `LIB${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function issueStudentCredentials(student, preferredPassword = "") {
  const plainPassword = preferredPassword || student.issuedPassword || generateStudentPassword();
  student.loginId = student.loginId || generateStudentLoginId(student);
  student.issuedPassword = plainPassword;
  student.loginEnabled = true;
  student.password = await hashPassword(plainPassword);
  await student.save();
  return student;
}

function buildLibrarianPayload(librarian) {
  return {
    id: librarian._id,
    name: librarian.name,
    email: librarian.email,
    phone: librarian.phone,
    role: librarian.role,
    chatEnabled: librarian.chatEnabled,
    createdAt: librarian.createdAt,
  };
}

function buildSeatPayload(seat) {
  return {
    id: seat._id,
    number: seat.number,
    label: seat.label,
    status: seat.status,
    student: seat.studentId
      ? {
          id: seat.studentId._id,
          name: seat.studentId.name,
          seatNumber: seat.studentId.seatNumber,
        }
      : null,
  };
}

function buildAttendancePayload(record) {
  return {
    id: record._id,
    student: record.studentId?.name || "Unknown Student",
    studentId: record.studentId?._id || null,
    seat: record.seatNumber,
    checkIn: formatTime(record.checkIn),
    checkOut: formatTime(record.checkOut),
    date: record.dateKey,
  };
}

function buildPaymentPayload(payment) {
  return {
    id: payment._id,
    student: payment.studentId?.name || "Unknown Student",
    studentId: payment.studentId?._id || null,
    seat: payment.seatNumber,
    month: payment.month,
    amount: payment.amount,
    status: payment.status,
  };
}

function buildDocumentPayload(document) {
  return {
    id: document._id,
    student: document.studentId?.name || "Unknown Student",
    studentId: document.studentId?._id || null,
    seat: document.seatNumber,
    document: document.name,
    uploadedAt: document.createdAt,
    status: document.status,
    fileUrl: document.fileUrl,
  };
}

function buildChatMessagePayload(message) {
  return {
    id: message._id,
    senderId: message.senderId,
    senderName: message.senderName,
    senderRole: message.senderRole,
    tag: message.tag,
    message: message.message,
    attachmentName: message.attachmentName,
    attachmentUrl: message.attachmentUrl,
    attachmentType: message.attachmentType,
    createdAt: message.createdAt,
  };
}

async function ensureSeats(libraryId, count = DEFAULT_SEAT_COUNT) {
  const existing = await Seat.countDocuments({ libraryId });

  if (existing >= count) {
    return;
  }

  const seatsToCreate = [];
  for (let index = existing + 1; index <= count; index += 1) {
    seatsToCreate.push({
      libraryId,
      number: index,
      label: `Seat ${index}`,
      status: "empty",
    });
  }

  if (seatsToCreate.length) {
    await Seat.insertMany(seatsToCreate);
  }
}

async function assignNextSeatNumber(libraryId) {
  await ensureSeats(libraryId);
  const emptySeat = await Seat.findOne({ libraryId, status: "empty" }).sort({ number: 1 });

  if (emptySeat) {
    return String(emptySeat.number);
  }

  const lastSeat = await Seat.findOne({ libraryId }).sort({ number: -1 });
  const nextSeatNumber = (lastSeat?.number || 0) + 1;
  await ensureSeats(libraryId, nextSeatNumber);
  return String(nextSeatNumber);
}

async function syncSeatAssignment(libraryId, seatNumberValue, studentId) {
  const seatNumber = parseSeatNumber(seatNumberValue);

  if (!seatNumber) {
    return null;
  }

  await ensureSeats(libraryId, Math.max(DEFAULT_SEAT_COUNT, seatNumber));
  const seat = await Seat.findOne({ libraryId, number: seatNumber });

  if (!seat) {
    return null;
  }

  if (studentId) {
    await Seat.updateMany(
      {
        libraryId,
        studentId,
        _id: { $ne: seat._id },
      },
      {
        $set: {
          studentId: null,
          status: "empty",
        },
      }
    );
  }

  seat.studentId = studentId || null;
  seat.status = studentId ? "occupied" : "empty";
  await seat.save();

  return seat;
}

async function ensureMonthlyPayment(student, status, amount = 2500) {
  const month = formatMonth();
  const existing = await Payment.findOne({
    libraryId: student.libraryId,
    studentId: student._id,
    month,
  });

  if (existing) {
    existing.status = status;
    existing.amount = amount;
    if (status === "paid" && !existing.paidAt) {
      existing.paidAt = new Date();
    }
    await existing.save();
    return existing;
  }

  return Payment.create({
    libraryId: student.libraryId,
    studentId: student._id,
    seatNumber: student.seatNumber,
    month,
    amount,
    status,
    paidAt: status === "paid" ? new Date() : null,
  });
}

function formatDurationFromDate(startedAt) {
  if (!startedAt) {
    return "";
  }

  const elapsedMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const totalMinutes = Math.floor(elapsedMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

async function enrichStudentsWithLiveSessions(libraryId, students) {
  if (!students.length) {
    return students;
  }

  const studentIds = students.map((student) => student._id);
  const activeAttendance = await Attendance.find({
    libraryId,
    studentId: { $in: studentIds },
    checkOut: null,
  }).sort({ createdAt: -1 });

  const attendanceMap = new Map(activeAttendance.map((record) => [String(record.studentId), record]));

  return students.map((student) => {
    const activeRecord = attendanceMap.get(String(student._id));
    if (activeRecord) {
      student.activeSessionStartedAt = activeRecord.checkIn;
      student.currentSessionDuration = formatDurationFromDate(activeRecord.checkIn);
    }
    return student;
  });
}

async function checkInStudent(libraryId, student) {
  const todayKey = toDateKey();
  let record = await Attendance.findOne({
    libraryId,
    studentId: student._id,
    dateKey: todayKey,
  }).populate("studentId");

  if (record) {
    record.checkIn = record.checkOut ? new Date() : record.checkIn || new Date();
    record.checkOut = null;
    await record.save();
    await record.populate("studentId");
  } else {
    record = await Attendance.create({
      libraryId,
      studentId: student._id,
      seatNumber: student.seatNumber,
      dateKey: todayKey,
      checkIn: new Date(),
    });
    await record.populate("studentId");
  }

  student.currentlyInLibrary = true;
  await student.save();
  await syncSeatAssignment(libraryId, student.seatNumber, student._id);

  return record;
}

async function checkOutStudent(libraryId, student) {
  const record = await Attendance.findOne({
    libraryId,
    studentId: student._id,
    checkOut: null,
  }).populate("studentId");

  if (!record) {
    student.currentlyInLibrary = false;
    await student.save();
    return null;
  }

  if (!record.checkOut) {
    record.checkOut = new Date();
  }

  const sessionMinutes = record.checkIn ? Math.max(0, Math.round((record.checkOut - record.checkIn) / (1000 * 60))) : 0;
  student.hoursSpent = (student.hoursSpent || 0) + Math.round(sessionMinutes / 60);
  student.currentlyInLibrary = false;

  await Promise.all([record.save(), student.save()]);

  return record;
}

async function createDocumentRecords(student, documents, files = []) {
  const created = [];

  if (Array.isArray(documents) && documents.length) {
    for (const name of documents) {
      created.push(
        await Document.create({
          libraryId: student.libraryId,
          studentId: student._id,
          seatNumber: student.seatNumber,
          name,
          fileName: name,
          fileUrl: `/uploads/${encodeURIComponent(name)}`,
          status: "verified",
        })
      );
    }
  }

  for (const file of files) {
    const stored = await saveUpload(file, { prefix: "documents" });
    created.push(
      await Document.create({
        libraryId: student.libraryId,
        studentId: student._id,
        seatNumber: student.seatNumber,
        name: file.originalname,
        fileName: stored.fileName,
        fileUrl: stored.url,
        status: "pending review",
      })
    );
  }

  return created;
}

async function getStudentDashboard(studentId) {
  const student = await Student.findById(studentId).populate("libraryId");

  if (!student) {
    return null;
  }

    const [attendanceHistory, payments, documents, chatMessages] = await Promise.all([
    Attendance.find({ studentId }).sort({ dateKey: -1, createdAt: -1 }).limit(60),
    Payment.find({ studentId }).populate("studentId").sort({ createdAt: -1 }).limit(24),
    Document.find({ studentId }).populate("studentId").sort({ createdAt: -1 }).limit(24),
    ChatMessage.find({ libraryId: student.libraryId._id || student.libraryId })
      .sort({ createdAt: -1 })
      .limit(CHAT_MESSAGE_LIMIT),
  ]);

  return {
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      profilePhotoName: student.profilePhotoName,
      profilePhotoUrl: student.profilePhotoUrl,
      seatNumber: student.seatNumber,
      shift: student.shift,
      shiftTiming: student.shiftTiming,
      shiftStartTime: student.shiftStartTime,
      shiftEndTime: student.shiftEndTime,
      fullDay: student.fullDay,
      paymentStatus: student.paymentStatus,
      paymentMode: student.paymentMode,
      loginId: student.loginId,
      issuedPassword: student.issuedPassword,
      loginEnabled: student.loginEnabled,
      documents: student.documents,
      hoursSpent: student.hoursSpent,
      currentlyInLibrary: student.currentlyInLibrary,
      chatEnabled: student.chatEnabled,
      library: student.libraryId,
    },
    seatNumber: student.seatNumber,
    paymentStatus: student.paymentStatus,
    nextPaymentDate: getNextPaymentDate(),
    currentSessionStartedAt: attendanceHistory.find((item) => !item.checkOut)?.checkIn || null,
    currentSessionDuration: attendanceHistory.find((item) => !item.checkOut)?.checkIn
      ? formatDurationFromDate(attendanceHistory.find((item) => !item.checkOut)?.checkIn)
      : "",
    uploadedDocuments: documents.map(buildDocumentPayload),
    chatMessages: chatMessages.reverse().map(buildChatMessagePayload),
    attendanceHistory: attendanceHistory.map((item) => ({
      id: item._id,
      date: item.dateKey,
      checkIn: formatTime(item.checkIn),
      checkOut: formatTime(item.checkOut),
      hours:
        item.checkOut && item.checkIn
          ? `${Math.max(0, Math.round((item.checkOut - item.checkIn) / (1000 * 60)))} mins`
          : "Active",
    })),
    payments: payments.map(buildPaymentPayload),
  };
}

async function buildLibraryDashboard(libraryId) {
  await ensureSeats(libraryId);
  const libraryObjectId = toObjectId(libraryId);

  const [library, seats, totalStudents, currentStudents, paidStudents, pendingPayments, totalHoursResult, todaysAttendance, pendingDocuments, totalAttendanceRecords, totalPayments, totalDocuments, totalLibrarians, revenueResult, recentLibrarians, recentStudents, recentAttendance, recentPayments, recentDocuments] = await Promise.all([
    Library.findById(libraryId).lean(),
    Seat.find({ libraryId }).populate("studentId").sort({ number: 1 }),
    Student.countDocuments({ libraryId }),
    Student.countDocuments({ libraryId, currentlyInLibrary: true }),
    Student.countDocuments({ libraryId, paymentStatus: "paid" }),
    Payment.countDocuments({ libraryId, status: { $ne: "paid" } }),
    Student.aggregate([
      { $match: { libraryId: libraryObjectId } },
      { $group: { _id: null, total: { $sum: "$hoursSpent" } } },
    ]),
    Attendance.countDocuments({ libraryId, dateKey: toDateKey() }),
    Document.countDocuments({ libraryId, status: { $ne: "verified" } }),
    Attendance.countDocuments({ libraryId }),
    Payment.countDocuments({ libraryId }),
    Document.countDocuments({ libraryId }),
    Librarian.countDocuments({ libraryId }),
    Payment.aggregate([
      { $match: { libraryId: libraryObjectId, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Librarian.find({ libraryId }).sort({ createdAt: -1 }).limit(DASHBOARD_PREVIEW_LIMIT),
    Student.find({ libraryId }).sort({ createdAt: -1 }).limit(DASHBOARD_PREVIEW_LIMIT),
    Attendance.find({ libraryId }).populate("studentId").sort({ createdAt: -1 }).limit(DASHBOARD_PREVIEW_LIMIT),
    Payment.find({ libraryId }).populate("studentId").sort({ createdAt: -1 }).limit(DASHBOARD_PREVIEW_LIMIT),
    Document.find({ libraryId }).populate("studentId").sort({ createdAt: -1 }).limit(DASHBOARD_PREVIEW_LIMIT),
  ]);

  if (!library) {
    return null;
  }

  const occupiedSeats = seats.filter((seat) => seat.status === "occupied").length;
  const emptySeats = seats.length - occupiedSeats;
  const totalHours = totalHoursResult[0]?.total || 0;
  const totalRevenue = revenueResult[0]?.total || 0;

  const enrichedRecentStudents = await enrichStudentsWithLiveSessions(libraryId, recentStudents);

  return {
    library: {
      id: library._id,
      name: library.name,
      createdByName: library.createdByName,
      contactEmail: library.contactEmail,
      location: library.location,
      latitude: library.latitude,
      longitude: library.longitude,
      createdAt: library.createdAt,
    },
    stats: {
      totalStudents,
      occupiedSeats,
      emptySeats,
      todaysAttendance,
      currentStudents,
      paidStudents,
      pendingPayments,
      pendingDocuments,
      totalHours,
      totalAttendanceRecords,
      totalPayments,
      totalDocuments,
      totalLibrarians,
      totalRevenue,
    },
    librarians: recentLibrarians.map(buildLibrarianPayload),
    students: enrichedRecentStudents.map(buildStudentPayload),
    seats: seats.map(buildSeatPayload),
    attendance: recentAttendance.map(buildAttendancePayload),
    payments: recentPayments.map(buildPaymentPayload),
    documents: recentDocuments.map(buildDocumentPayload),
  };
}

async function buildSuperAdminDashboard(location = "") {
  const trimmedLocation = String(location || "").trim();
  const libraryQuery = trimmedLocation
    ? { location: { $regex: escapeRegex(trimmedLocation), $options: "i" } }
    : {};
  const libraries = await Library.find(libraryQuery).sort({ createdAt: -1 }).lean();

  if (!libraries.length) {
    return {
      summary: {
        totalLibraries: 0,
        totalStudents: 0,
        totalRevenue: 0,
        activeLibrarians: 0,
      },
      locations: [],
      libraries: [],
    };
  }

  const libraryIds = libraries.map((library) => library._id);
  const objectIds = libraryIds.map(toObjectId);

  const [studentCounts, librarianCounts, paidRevenue, paidCounts] = await Promise.all([
    Student.aggregate([
      { $match: { libraryId: { $in: objectIds } } },
      { $group: { _id: "$libraryId", totalStudents: { $sum: 1 } } },
    ]),
    Librarian.aggregate([
      { $match: { libraryId: { $in: objectIds } } },
      { $group: { _id: "$libraryId", totalLibrarians: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { libraryId: { $in: objectIds }, status: "paid" } },
      { $group: { _id: "$libraryId", totalRevenue: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { libraryId: { $in: objectIds }, status: "paid" } },
      { $group: { _id: "$libraryId", paidPayments: { $sum: 1 } } },
    ]),
  ]);

  const studentMap = new Map(studentCounts.map((item) => [String(item._id), item.totalStudents]));
  const librarianMap = new Map(librarianCounts.map((item) => [String(item._id), item.totalLibrarians]));
  const revenueMap = new Map(paidRevenue.map((item) => [String(item._id), item.totalRevenue]));
  const paidMap = new Map(paidCounts.map((item) => [String(item._id), item.paidPayments]));

  const locationMap = new Map();
  const libraryItems = libraries
    .map((library) => {
      const id = String(library._id);
      const totalRevenue = revenueMap.get(id) || 0;
      const totalStudents = studentMap.get(id) || 0;
      const totalLibrarians = librarianMap.get(id) || 0;
      const paidPaymentsCount = paidMap.get(id) || 0;
      const normalizedLocation = library.location || "Unspecified";
      const existing = locationMap.get(normalizedLocation) || { location: normalizedLocation, libraries: 0, revenue: 0 };
      locationMap.set(normalizedLocation, {
        location: normalizedLocation,
        libraries: existing.libraries + 1,
        revenue: existing.revenue + totalRevenue,
      });

      return {
        id,
        name: library.name,
        location: normalizedLocation,
        latitude: library.latitude ?? null,
        longitude: library.longitude ?? null,
        contactEmail: library.contactEmail,
        createdByName: library.createdByName,
        createdAt: library.createdAt,
        totalStudents,
        totalLibrarians,
        totalRevenue,
        paidPaymentsCount,
      };
    })
    .sort((left, right) => right.totalRevenue - left.totalRevenue || right.totalStudents - left.totalStudents);

  return {
    summary: {
      totalLibraries: libraryItems.length,
      totalStudents: libraryItems.reduce((sum, item) => sum + item.totalStudents, 0),
      totalRevenue: libraryItems.reduce((sum, item) => sum + item.totalRevenue, 0),
      activeLibrarians: libraryItems.reduce((sum, item) => sum + item.totalLibrarians, 0),
    },
    locations: Array.from(locationMap.values()).sort((left, right) => right.revenue - left.revenue),
    libraries: libraryItems,
  };
}

async function seedDemoStudents(libraryId) {
  await ensureSeats(libraryId);

  const existingStudents = await Student.countDocuments({ libraryId });

  if (existingStudents > 0) {
    return;
  }

  const hashedPassword = await hashPassword("student123");
  const suffix = libraryId.toString().slice(-6);
  const demoStudents = [
    {
      name: "Aarav Sharma",
      email: `${suffix}.aarav@student.library`,
      phone: "9876543210",
      address: "Sector 14, Noida",
      seatNumber: "1",
      shift: "Morning",
      shiftTiming: "8:00 AM - 2:00 PM",
      shiftStartTime: "08:00",
      shiftEndTime: "14:00",
      paymentStatus: "paid",
      paymentMode: "cash",
      documents: ["Aadhaar Card", "College ID"],
      hoursSpent: 124,
      currentlyInLibrary: true,
      chatEnabled: true,
    },
    {
      name: "Riya Mehta",
      email: `${suffix}.riya@student.library`,
      phone: "9811100443",
      address: "Raj Nagar, Ghaziabad",
      seatNumber: "2",
      shift: "Evening",
      shiftTiming: "2:00 PM - 8:00 PM",
      shiftStartTime: "14:00",
      shiftEndTime: "20:00",
      paymentStatus: "pending",
      paymentMode: "online",
      documents: ["PAN Card", "Passport Photo"],
      hoursSpent: 86,
      currentlyInLibrary: true,
    },
    {
      name: "Karan Sethi",
      email: `${suffix}.karan@student.library`,
      phone: "9899133210",
      address: "Patel Nagar, Delhi",
      seatNumber: "3",
      shift: "Full Day",
      shiftTiming: "8:00 AM - 8:00 PM",
      shiftStartTime: "08:00",
      shiftEndTime: "20:00",
      fullDay: true,
      paymentStatus: "paid",
      paymentMode: "cash",
      documents: ["Address Proof"],
      hoursSpent: 152,
      currentlyInLibrary: false,
    },
    {
      name: "Sneha Kapoor",
      email: `${suffix}.sneha@student.library`,
      phone: "9958711903",
      address: "Model Town, Delhi",
      seatNumber: "4",
      shift: "Morning",
      shiftTiming: "7:00 AM - 1:00 PM",
      shiftStartTime: "07:00",
      shiftEndTime: "13:00",
      paymentStatus: "overdue",
      paymentMode: "online",
      documents: ["Aadhaar Card", "College ID"],
      hoursSpent: 67,
      currentlyInLibrary: false,
    },
  ];

  for (const item of demoStudents) {
    const student = await Student.create({
      ...item,
      libraryId,
      password: hashedPassword,
    });

    if (student.paymentStatus === "paid") {
      await issueStudentCredentials(
        student,
        student.email === `${suffix}.aarav@student.library` ? "student123" : "student123"
      );
    }

    await syncSeatAssignment(libraryId, student.seatNumber, student._id);
    await ensureMonthlyPayment(student, student.paymentStatus);
    await createDocumentRecords(student, student.documents);

    await Attendance.create({
      libraryId,
      studentId: student._id,
      seatNumber: student.seatNumber,
      dateKey: toDateKey(),
      checkIn: new Date(Date.now() - (2 + demoStudents.indexOf(item)) * 60 * 60 * 1000),
      checkOut: item.currentlyInLibrary ? null : new Date(Date.now() - demoStudents.indexOf(item) * 30 * 60 * 1000),
    });
  }
}

async function repairLegacyLibraryData(libraryId) {
  await ensureSeats(libraryId);
  const students = await Student.find({ libraryId }).sort({ createdAt: 1 });

  for (const [index, student] of students.entries()) {
    let changed = false;

    if (student.loginId === "") {
      student.loginId = null;
      changed = true;
    }

    if (!student.address) {
      student.address = "Library member address";
      changed = true;
    }

    if (!student.shiftTiming) {
      student.shiftTiming = buildShiftTiming(student.shiftStartTime, student.shiftEndTime, student.fullDay) || getDefaultShiftTiming(student.shift);
      changed = true;
    }

    if (!student.seatNumber) {
      student.seatNumber = String(index + 1);
      changed = true;
    }

    if (changed) {
      await student.save();
    }

    if (student.paymentStatus === "paid" && (!student.loginId || !student.issuedPassword || !student.loginEnabled)) {
      await issueStudentCredentials(student, student.email === "student@library.com" ? "student123" : "");
    }

    await syncSeatAssignment(libraryId, student.seatNumber, student._id);
    await ensureMonthlyPayment(student, student.paymentStatus || "pending");

    const existingDocuments = await Document.countDocuments({ studentId: student._id });
    if (existingDocuments === 0 && student.documents?.length) {
      await createDocumentRecords(student, student.documents);
    }
  }
}

async function createDefaultLibrary() {
  const existingLibrary = await Library.findOne().sort({ createdAt: 1 });

  if (existingLibrary) {
    if (!existingLibrary.location) {
      existingLibrary.location = "Delhi NCR";
      await existingLibrary.save();
    }
    await ensureSeats(existingLibrary._id);
    await seedDemoStudents(existingLibrary._id);
    await repairLegacyLibraryData(existingLibrary._id);
    const existingMessages = await ChatMessage.countDocuments({ libraryId: existingLibrary._id });
    if (existingMessages === 0) {
      await ChatMessage.insertMany([
        {
          libraryId: existingLibrary._id,
          senderName: "Priya Verma",
          senderRole: "admin",
          tag: "announcement",
          message: "Welcome to the study room chat. Share seat updates here.",
        },
        {
          libraryId: existingLibrary._id,
          senderName: "Aarav Sharma",
          senderRole: "student",
          tag: "seat-update",
          message: "I am in Seat 1 for the morning shift.",
        },
      ]);
    }
    const adminPassword = await hashPassword("admin123");
    const staffPassword = await hashPassword("librarian123");
    const adminAccount = await Librarian.findOne({ email: "admin@library.com" });
    if (!adminAccount) {
      await Librarian.create({
        name: "Priya Verma",
        email: "admin@library.com",
        password: adminPassword,
        role: "admin",
        phone: "9876500000",
        chatEnabled: true,
        libraryId: existingLibrary._id,
      });
    }
    const staffAccount = await Librarian.findOne({ email: "librarian@library.com" });
    if (!staffAccount) {
      await Librarian.create({
        name: "Desk Librarian",
        email: "librarian@library.com",
        password: staffPassword,
        role: "librarian",
        phone: "9876500011",
        chatEnabled: true,
        libraryId: existingLibrary._id,
      });
    }
    const defaultStudent = await Student.findOne({ libraryId: existingLibrary._id }).sort({ createdAt: 1 });
    const reservedStudent = await Student.findOne({ email: "student@library.com" });
    if (defaultStudent && (!reservedStudent || String(reservedStudent._id) === String(defaultStudent._id))) {
      defaultStudent.email = "student@library.com";
      await defaultStudent.save();
    }
    const superAdminPassword = await hashPassword("super123");
    const existingSuperAdmin = await SuperAdmin.findOne({ email: "superadmin@library.com" });
    if (!existingSuperAdmin) {
      await SuperAdmin.create({
        name: "Platform Owner",
        email: "superadmin@library.com",
        password: superAdminPassword,
      });
    }
    return existingLibrary;
  }

  const adminPassword = await hashPassword("admin123");
  const staffPassword = await hashPassword("librarian123");

  const library = await Library.create({
    name: "Blue Haven Study Room",
    createdByName: "Priya Verma",
    contactEmail: "admin@library.com",
    location: "Delhi NCR",
  });

  await Librarian.create({
    name: "Priya Verma",
    email: "admin@library.com",
    password: adminPassword,
    role: "admin",
    phone: "9876500000",
    chatEnabled: true,
    libraryId: library._id,
  });

  await Librarian.create({
    name: "Desk Librarian",
    email: "librarian@library.com",
    password: staffPassword,
    role: "librarian",
    phone: "9876500011",
    chatEnabled: true,
    libraryId: library._id,
  });

  await seedDemoStudents(library._id);
  await repairLegacyLibraryData(library._id);
  const existingMessages = await ChatMessage.countDocuments({ libraryId: library._id });
  if (existingMessages === 0) {
    await ChatMessage.insertMany([
      {
        libraryId: library._id,
        senderName: "Priya Verma",
        senderRole: "admin",
        tag: "announcement",
        message: "Welcome to the study room chat. Share seat updates here.",
      },
      {
        libraryId: library._id,
        senderName: "Aarav Sharma",
        senderRole: "student",
        tag: "seat-update",
        message: "I am in Seat 1 for the morning shift.",
      },
    ]);
  }
  const defaultStudent = await Student.findOne({ libraryId: library._id }).sort({ createdAt: 1 });
  if (defaultStudent) {
    defaultStudent.email = "student@library.com";
    await defaultStudent.save();
  }
  await SuperAdmin.create({
    name: "Platform Owner",
    email: "superadmin@library.com",
    password: await hashPassword("super123"),
  });
  return library;
}

exports.buildLibraryDashboard = buildLibraryDashboard;
exports.buildSuperAdminDashboard = buildSuperAdminDashboard;
exports.createDefaultLibrary = createDefaultLibrary;
exports.getStudentDashboard = getStudentDashboard;
exports.seedDemoStudents = seedDemoStudents;

exports.getLibraryDashboard = async (req, res) => {
  try {
    const dashboard = await buildLibraryDashboard(req.params.libraryId);

    if (!dashboard) {
      return res.status(404).json({ message: "Library not found" });
    }

    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load dashboard",
      error: error.message,
    });
  }
};

exports.getSuperAdminDashboard = async (req, res) => {
  try {
    const dashboard = await buildSuperAdminDashboard(req.query.location);
    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load super admin dashboard",
      error: error.message,
    });
  }
};

exports.getSuperAdminLibraryView = async (req, res) => {
  try {
    const dashboard = await buildLibraryDashboard(req.params.libraryId);

    if (!dashboard) {
      return res.status(404).json({ message: "Library not found" });
    }

    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load library detail",
      error: error.message,
    });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const { page, limit, skip } = getPageOptions(req.query, CHAT_MESSAGE_LIMIT);
    const total = await ChatMessage.countDocuments({ libraryId: req.params.libraryId });
    const messages = await ChatMessage.find({ libraryId: req.params.libraryId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return res.json(buildPaginatedResponse(messages.reverse().map(buildChatMessagePayload), page, limit, total));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load chat messages",
      error: error.message,
    });
  }
};

exports.postChatMessage = async (req, res) => {
  try {
    const { message, tag } = req.body;
    const senderRole = req.auth?.role;
    const senderId = req.auth?.studentId || req.auth?.librarianId;

    if (!senderId || !senderRole || !message) {
      return res.status(400).json({
        message: "Authenticated sender and message are required",
      });
    }

    const file = req.file;
    const mimetype = file?.mimetype || "";
    const attachmentType = file ? (mimetype.startsWith("image/") ? "image" : "document") : "";
    const storedAttachment = file ? await saveUpload(file, { prefix: "chat" }) : null;

    const senderModel = senderRole === "student" ? Student : Librarian;
    const sender = await senderModel.findOne({
      _id: senderId,
      libraryId: req.params.libraryId,
    });

    if (!sender) {
      return res.status(404).json({ message: "Chat sender not found" });
    }

    if (!sender.chatEnabled) {
      return res.status(403).json({ message: "You no longer have access to library chat" });
    }

    const created = await ChatMessage.create({
      libraryId: req.params.libraryId,
      senderId: sender._id,
      senderName: String(sender.name || "").trim(),
      senderRole,
      tag: String(tag || "").trim(),
      message: String(message).trim(),
      attachmentName: file?.originalname || "",
      attachmentUrl: storedAttachment?.url || "",
      attachmentType,
    });

    const payload = buildChatMessagePayload(created);
    emitLibraryEvent(req.params.libraryId, "chat:message", payload);

    return res.status(201).json({
      message: "Chat message sent",
      chatMessage: payload,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to send chat message",
      error: error.message,
    });
  }
};

exports.updateChatAccess = async (req, res) => {
  try {
    const { participantId, participantType } = req.params;
    const { chatEnabled } = req.body;

    const Model = participantType === "student" ? Student : Librarian;
    const participant = await Model.findOne({
      _id: participantId,
      libraryId: req.params.libraryId,
    });

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    participant.chatEnabled = Boolean(chatEnabled);
    await participant.save();

    emitLibraryEvent(req.params.libraryId, "chat:access-updated", {
      participant: {
        id: participant._id,
        chatEnabled: participant.chatEnabled,
        participantType,
      },
    });

    return res.json({
      message: participant.chatEnabled ? "Chat access restored" : "User removed from chat",
      participant: {
        id: participant._id,
        chatEnabled: participant.chatEnabled,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update chat access",
      error: error.message,
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { page, limit, skip } = getPageOptions(req.query, 50);
    const search = String(req.query.search || "").trim();
    const query = { libraryId: req.params.libraryId };

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
        { phone: { $regex: escapeRegex(search), $options: "i" } },
        { seatNumber: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    const [total, students] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    const enrichedStudents = await enrichStudentsWithLiveSessions(req.params.libraryId, students);

    return res.json(buildPaginatedResponse(enrichedStudents.map(buildStudentPayload), page, limit, total));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load students",
      error: error.message,
    });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.studentId,
      libraryId: req.params.libraryId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(buildStudentPayload(student));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load student",
      error: error.message,
    });
  }
};

exports.registerStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      seatNumber,
      shift,
      paymentMode,
      shiftStartTime,
      shiftEndTime,
      fullDay,
    } = req.body;
    const libraryId = req.params.libraryId || req.body.libraryId;
    const uploadedFiles = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
    const assignedSeatNumber = String(seatNumber || (await assignNextSeatNumber(libraryId))).trim();
    const normalizedFullDay = String(fullDay || "").toLowerCase() === "true" || fullDay === true;
    const resolvedShift = normalizedFullDay ? "Full Day" : String(shift || "Custom").trim();
    const resolvedShiftTiming =
      buildShiftTiming(String(shiftStartTime || "").trim(), String(shiftEndTime || "").trim(), normalizedFullDay) ||
      String(req.body.shiftTiming || "").trim() ||
      getDefaultShiftTiming(resolvedShift);

    if (!libraryId || !name || !email || !password || !phone || !address) {
      return res.status(400).json({
        message: "libraryId, name, email, password, phone, and address are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingStudent = await Student.findOne({ email: normalizedEmail });

    if (existingStudent) {
      return res.status(409).json({ message: "A student with this email already exists" });
    }

    const student = await Student.create({
      libraryId,
      name: name.trim(),
      email: normalizedEmail,
      password: await hashPassword(password),
      phone: phone.trim(),
      address: address.trim(),
      seatNumber: assignedSeatNumber,
      shift: resolvedShift,
      shiftTiming: resolvedShiftTiming,
      shiftStartTime: normalizedFullDay ? "" : String(shiftStartTime || "").trim(),
      shiftEndTime: normalizedFullDay ? "" : String(shiftEndTime || "").trim(),
      fullDay: normalizedFullDay,
      paymentStatus: "pending",
      paymentMode: String(paymentMode || "").trim().toLowerCase(),
      documents: uploadedFiles.map((file) => file.originalname),
      hoursSpent: 0,
      currentlyInLibrary: true,
      loginEnabled: false,
    });

    await syncSeatAssignment(libraryId, student.seatNumber, student._id);
    await ensureMonthlyPayment(student, student.paymentStatus);
    await createDocumentRecords(student, student.documents, uploadedFiles);

    if (student.paymentStatus === "paid") {
      await issueStudentCredentials(student);
    }

    const attendance = await Attendance.create({
      libraryId,
      studentId: student._id,
      seatNumber: student.seatNumber,
      dateKey: toDateKey(),
      checkIn: new Date(),
      checkOut: null,
    });

    const dashboard = await buildLibraryDashboard(libraryId);

    return res.status(201).json({
      message: "Student created successfully",
      student: buildStudentPayload(student),
      attendance: buildAttendancePayload(await attendance.populate("studentId")),
      dashboard,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    return res.status(status).json({
      message: status === 409 ? "Seat number or student email already exists" : "Unable to register student",
      error: error.message,
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.studentId,
      libraryId: req.params.libraryId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const previousSeat = student.seatNumber;
    const fields = ["name", "phone", "address", "seatNumber", "shift", "shiftTiming", "hoursSpent", "paymentStatus"];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    }

    if (req.body.paymentMode !== undefined) {
      student.paymentMode = String(req.body.paymentMode || "").trim().toLowerCase();
    }

    if (req.body.fullDay !== undefined) {
      student.fullDay = String(req.body.fullDay).toLowerCase() === "true";
    }

    if (req.body.shiftStartTime !== undefined) {
      student.shiftStartTime = String(req.body.shiftStartTime || "").trim();
    }

    if (req.body.shiftEndTime !== undefined) {
      student.shiftEndTime = String(req.body.shiftEndTime || "").trim();
    }

    student.shiftTiming =
      buildShiftTiming(student.shiftStartTime, student.shiftEndTime, student.fullDay) ||
      student.shiftTiming ||
      getDefaultShiftTiming(student.shift);

    const uploadedFiles = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
    if (uploadedFiles.length) {
      student.documents = [...student.documents, ...uploadedFiles.map((file) => file.originalname)];
    }

    await student.save();

    if (uploadedFiles.length) {
      await createDocumentRecords(student, [], uploadedFiles);
    }

    if (previousSeat !== student.seatNumber) {
      await syncSeatAssignment(req.params.libraryId, previousSeat, null);
      await syncSeatAssignment(req.params.libraryId, student.seatNumber, student._id);
    }

    await ensureMonthlyPayment(student, student.paymentStatus);

    if (student.paymentStatus === "paid" && (!student.loginId || !student.issuedPassword || !student.loginEnabled)) {
      await issueStudentCredentials(student);
    }

    return res.json({
      message: "Student updated successfully",
      student: buildStudentPayload(student),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update student",
      error: error.message,
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.studentId,
      libraryId: req.params.libraryId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await Promise.all([
      syncSeatAssignment(req.params.libraryId, student.seatNumber, null),
      Attendance.deleteMany({ studentId: student._id }),
      Payment.deleteMany({ studentId: student._id }),
      Document.deleteMany({ studentId: student._id }),
    ]);

    return res.json({ message: "Student deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete student",
      error: error.message,
    });
  }
};

exports.updateStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.studentId,
      libraryId: req.params.libraryId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const editableFields = ["name", "email", "phone", "address", "shift", "shiftTiming"];
    for (const field of editableFields) {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        student[field] = req.body[field];
      }
    }

    const photo = req.files?.photo?.[0];
    const document = req.files?.document?.[0];

    if (photo) {
      const storedPhoto = await saveUpload(photo, { prefix: "profiles" });
      student.profilePhotoName = photo.originalname;
      student.profilePhotoUrl = storedPhoto.url;
    }

    if (document) {
      student.documents = [...student.documents, document.originalname];
      await createDocumentRecords(student, [], [document]);
    }

    await student.save();

    return res.json({
      message: "Profile updated successfully",
      student: buildStudentPayload(student),
      dashboard: await getStudentDashboard(student._id),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update profile",
      error: error.message,
    });
  }
};

exports.changeStudentPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "password is required" });
    }

    const student = await Student.findOne({
      _id: req.params.studentId,
      libraryId: req.params.libraryId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.password = await hashPassword(password);
    student.issuedPassword = password;
    student.loginEnabled = true;
    if (!student.loginId) {
      student.loginId = generateStudentLoginId(student);
    }
    await student.save();
    return res.json({
      message: "Password changed successfully",
      student: buildStudentPayload(student),
      dashboard: await getStudentDashboard(student._id),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to change password",
      error: error.message,
    });
  }
};

exports.getSeats = async (req, res) => {
  try {
    await ensureSeats(req.params.libraryId);
    const seats = await Seat.find({ libraryId: req.params.libraryId }).populate("studentId").sort({ number: 1 });
    return res.json(seats.map(buildSeatPayload));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load seats",
      error: error.message,
    });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { page, limit, skip } = getPageOptions(req.query, 50);
    const query = { libraryId: req.params.libraryId };
    if (req.query.dateKey) {
      query.dateKey = String(req.query.dateKey).trim();
    }

    const [total, records] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.find(query).populate("studentId").sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    return res.json(buildPaginatedResponse(records.map(buildAttendancePayload), page, limit, total));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load attendance",
      error: error.message,
    });
  }
};

exports.markPresent = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const student = await Student.findOne({
      _id: studentId,
      libraryId: req.params.libraryId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const record = await checkInStudent(req.params.libraryId, student);

    return res.json({
      message: "Attendance marked successfully",
      attendance: buildAttendancePayload(record),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to mark attendance",
      error: error.message,
    });
  }
};

exports.getAttendanceQrToken = async (req, res) => {
  try {
    return res.json({
      token: getQrPayload(req.params.libraryId),
      validFor: toDateKey(),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to generate attendance QR",
      error: error.message,
    });
  }
};

exports.scanAttendanceQr = async (req, res) => {
  try {
    const studentId = req.auth?.studentId;
    const libraryId = req.params.libraryId;
    const { token } = req.body;

    if (!studentId) {
      return res.status(403).json({ message: "Student access required" });
    }

    if (!verifyQrPayload(token, libraryId)) {
      return res.status(400).json({ message: "Invalid or expired QR code" });
    }

    const student = await Student.findOne({
      _id: studentId,
      libraryId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const activeRecord = await Attendance.findOne({
      libraryId,
      studentId: student._id,
      checkOut: null,
    });
    const wasInLibrary = Boolean(activeRecord);
    const attendance = wasInLibrary
      ? await checkOutStudent(libraryId, student)
      : await checkInStudent(libraryId, student);

    const dashboard = await getStudentDashboard(student._id);

    return res.json({
      message: wasInLibrary ? "Checked out successfully" : "Checked in successfully",
      mode: wasInLibrary ? "check-out" : "check-in",
      attendance: attendance ? buildAttendancePayload(attendance) : null,
      dashboard,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to process QR attendance",
      error: error.message,
    });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { page, limit, skip } = getPageOptions(req.query, 50);
    const query = { libraryId: req.params.libraryId };
    if (req.query.status) {
      query.status = String(req.query.status).trim().toLowerCase();
    }

    const [total, payments] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query).populate("studentId").sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    return res.json(buildPaginatedResponse(payments.map(buildPaymentPayload), page, limit, total));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load payments",
      error: error.message,
    });
  }
};

exports.markPaymentPaid = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      libraryId: req.params.libraryId,
    }).populate("studentId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = "paid";
    payment.paidAt = new Date();
    await payment.save();

    if (payment.studentId) {
      payment.studentId.paymentStatus = "paid";
      await issueStudentCredentials(payment.studentId);
    }

    return res.json({
      message: "Payment marked as paid",
      payment: buildPaymentPayload(payment),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update payment",
      error: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const { page, limit, skip } = getPageOptions(req.query, 50);
    const query = { libraryId: req.params.libraryId };
    if (req.query.status) {
      query.status = String(req.query.status).trim().toLowerCase();
    }

    const [total, documents] = await Promise.all([
      Document.countDocuments(query),
      Document.find(query).populate("studentId").sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    return res.json(buildPaginatedResponse(documents.map(buildDocumentPayload), page, limit, total));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load documents",
      error: error.message,
    });
  }
};

exports.registerLibrarian = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const libraryId = req.params.libraryId || req.body.libraryId;

    if (!libraryId || !name || !email || !password) {
      return res.status(400).json({
        message: "libraryId, name, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Librarian.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ message: "A librarian with this email already exists" });
    }

    const librarian = await Librarian.create({
      libraryId,
      name: name.trim(),
      email: normalizedEmail,
      password: await hashPassword(password),
      phone: String(phone || "").trim(),
      role: role === "admin" ? "admin" : "librarian",
    });

    return res.status(201).json({
      message: "Librarian created successfully",
      librarian: buildLibrarianPayload(librarian),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create librarian",
      error: error.message,
    });
  }
};

exports.getStudentDashboardHandler = async (req, res) => {
  try {
    if (
      req.auth?.role === "student" &&
      String(req.auth.studentId) !== String(req.params.studentId)
    ) {
      return res.status(403).json({ message: "You can only access your own dashboard" });
    }

    const dashboard = await getStudentDashboard(req.params.studentId);

    if (!dashboard) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load student dashboard",
      error: error.message,
    });
  }
};
