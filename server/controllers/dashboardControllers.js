const Attendance = require("../models/Attendance");
const ChatMessage = require("../models/ChatMessage");
const Document = require("../models/Document");
const Library = require("../models/Library");
const Librarian = require("../models/Librarian");
const Payment = require("../models/Payment");
const Seat = require("../models/Seat");
const Student = require("../models/Student");
const { hashPassword } = require("../utils/password");

const DEFAULT_SEAT_COUNT = 24;

function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
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
    paymentStatus: student.paymentStatus,
    loginId: student.loginId,
    issuedPassword: student.issuedPassword,
    loginEnabled: student.loginEnabled,
    documents: student.documents,
    hoursSpent: student.hoursSpent,
    currentlyInLibrary: student.currentlyInLibrary,
    chatEnabled: student.chatEnabled,
    createdAt: student.createdAt,
  };
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

async function createDocumentRecords(student, documents, file) {
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

  if (file) {
    created.push(
      await Document.create({
        libraryId: student.libraryId,
        studentId: student._id,
        seatNumber: student.seatNumber,
        name: file.originalname,
        fileName: file.filename,
        fileUrl: `/uploads/${file.filename}`,
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
    Attendance.find({ studentId }).sort({ dateKey: -1, createdAt: -1 }),
    Payment.find({ studentId }).populate("studentId").sort({ createdAt: -1 }),
    Document.find({ studentId }).populate("studentId").sort({ createdAt: -1 }),
    ChatMessage.find({ libraryId: student.libraryId._id || student.libraryId }).sort({ createdAt: 1 }).limit(100),
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
      paymentStatus: student.paymentStatus,
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
    uploadedDocuments: documents.map(buildDocumentPayload),
    chatMessages: chatMessages.map(buildChatMessagePayload),
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

  const [library, librarians, students, seats, attendance, payments, documents] = await Promise.all([
    Library.findById(libraryId),
    Librarian.find({ libraryId }).sort({ createdAt: 1 }),
    Student.find({ libraryId }).sort({ createdAt: -1 }),
    Seat.find({ libraryId }).populate("studentId").sort({ number: 1 }),
    Attendance.find({ libraryId }).populate("studentId").sort({ createdAt: -1 }),
    Payment.find({ libraryId }).populate("studentId").sort({ createdAt: -1 }),
    Document.find({ libraryId }).populate("studentId").sort({ createdAt: -1 }),
  ]);

  if (!library) {
    return null;
  }

  const todayKey = toDateKey();
  const occupiedSeats = seats.filter((seat) => seat.status === "occupied").length;
  const emptySeats = seats.length - occupiedSeats;
  const todaysAttendance = attendance.filter((entry) => entry.dateKey === todayKey).length;

  return {
    library: {
      id: library._id,
      name: library.name,
      createdByName: library.createdByName,
      contactEmail: library.contactEmail,
      createdAt: library.createdAt,
    },
    stats: {
      totalStudents: students.length,
      occupiedSeats,
      emptySeats,
      todaysAttendance,
    },
    librarians: librarians.map(buildLibrarianPayload),
    students: students.map(buildStudentPayload),
    seats: seats.map(buildSeatPayload),
    attendance: attendance.map(buildAttendancePayload),
    payments: payments.map(buildPaymentPayload),
    documents: documents.map(buildDocumentPayload),
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
      paymentStatus: "paid",
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
      paymentStatus: "pending",
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
      paymentStatus: "paid",
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
      paymentStatus: "overdue",
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

    if (!student.address) {
      student.address = "Library member address";
      changed = true;
    }

    if (!student.shiftTiming) {
      student.shiftTiming = student.shift ? `${student.shift} shift` : "Assigned by library";
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
    return existingLibrary;
  }

  const adminPassword = await hashPassword("admin123");
  const staffPassword = await hashPassword("librarian123");

  const library = await Library.create({
    name: "Blue Haven Study Room",
    createdByName: "Priya Verma",
    contactEmail: "admin@library.com",
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
  return library;
}

exports.buildLibraryDashboard = buildLibraryDashboard;
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

exports.getChatMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ libraryId: req.params.libraryId }).sort({ createdAt: 1 }).limit(100);
    return res.json(messages.map(buildChatMessagePayload));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load chat messages",
      error: error.message,
    });
  }
};

exports.postChatMessage = async (req, res) => {
  try {
    const { senderId, senderName, senderRole, message, tag } = req.body;

    if (!senderId || !senderName || !senderRole || !message) {
      return res.status(400).json({
        message: "senderId, senderName, senderRole, and message are required",
      });
    }

    const file = req.file;
    const mimetype = file?.mimetype || "";
    const attachmentType = file ? (mimetype.startsWith("image/") ? "image" : "document") : "";

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
      senderName: String(senderName).trim(),
      senderRole,
      tag: String(tag || "").trim(),
      message: String(message).trim(),
      attachmentName: file?.originalname || "",
      attachmentUrl: file ? `/uploads/${file.filename}` : "",
      attachmentType,
    });

    return res.status(201).json({
      message: "Chat message sent",
      chatMessage: buildChatMessagePayload(created),
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
    const students = await Student.find({ libraryId: req.params.libraryId }).sort({ createdAt: -1 });
    return res.json(students.map(buildStudentPayload));
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
      paymentStatus,
      hoursSpent,
    } = req.body;
    const libraryId = req.params.libraryId || req.body.libraryId;

    if (!libraryId || !name || !email || !password || !phone || !address || !seatNumber) {
      return res.status(400).json({
        message: "libraryId, name, email, password, phone, address, and seatNumber are required",
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
      seatNumber: String(seatNumber).trim(),
      shift: String(shift || "Morning").trim(),
      shiftTiming: String(req.body.shiftTiming || "").trim(),
      paymentStatus: String(paymentStatus || "pending").toLowerCase(),
      documents: req.file ? [req.file.originalname] : [],
      hoursSpent: Number(hoursSpent) || 0,
      currentlyInLibrary: true,
      loginEnabled: false,
    });

    await syncSeatAssignment(libraryId, student.seatNumber, student._id);
    await ensureMonthlyPayment(student, student.paymentStatus);
    await createDocumentRecords(student, student.documents, req.file);

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

    if (req.file) {
      student.documents = [...student.documents, req.file.originalname];
    }

    await student.save();

    if (req.file) {
      await createDocumentRecords(student, [], req.file);
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
      student.profilePhotoName = photo.originalname;
      student.profilePhotoUrl = `/uploads/${photo.filename}`;
    }

    if (document) {
      student.documents = [...student.documents, document.originalname];
      await createDocumentRecords(student, [], document);
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
    const records = await Attendance.find({ libraryId: req.params.libraryId }).populate("studentId").sort({ createdAt: -1 });
    return res.json(records.map(buildAttendancePayload));
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

    const todayKey = toDateKey();
    let record = await Attendance.findOne({
      libraryId: req.params.libraryId,
      studentId,
      dateKey: todayKey,
    }).populate("studentId");

    if (record) {
      if (record.checkOut) {
        record.checkOut = null;
      }
      record.checkIn = record.checkIn || new Date();
      await record.save();
      await record.populate("studentId");
    } else {
      record = await Attendance.create({
        libraryId: req.params.libraryId,
        studentId,
        seatNumber: student.seatNumber,
        dateKey: todayKey,
        checkIn: new Date(),
      });
      await record.populate("studentId");
    }

    student.currentlyInLibrary = true;
    await student.save();
    await syncSeatAssignment(req.params.libraryId, student.seatNumber, student._id);

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

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ libraryId: req.params.libraryId }).populate("studentId").sort({ createdAt: -1 });
    return res.json(payments.map(buildPaymentPayload));
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
    const documents = await Document.find({ libraryId: req.params.libraryId }).populate("studentId").sort({ createdAt: -1 });
    return res.json(documents.map(buildDocumentPayload));
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
