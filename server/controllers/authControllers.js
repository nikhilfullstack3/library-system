const Librarian = require("../models/Librarian");
const Library = require("../models/Library");
const { hashPassword } = require("../utils/password");
const { createSessionToken } = require("../utils/sessionToken");
const { buildLibraryDashboard, seedDemoStudents } = require("./dashboardControllers");
const { sendWelcomeEmail } = require("../services/mailer");

exports.registerLibrary = async (req, res) => {
  try {
    const { name, email, password, libraryName, phone, location, latitude, longitude } = req.body;

    if (!name || !email || !password || !libraryName) {
      return res.status(400).json({
        message: "name, email, password, and libraryName are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingLibrarian = await Librarian.findOne({ email: normalizedEmail });

    if (existingLibrarian) {
      return res.status(409).json({
        message: "A librarian with this email already exists",
      });
    }

    const library = await Library.create({
      name: libraryName.trim(),
      createdByName: name.trim(),
      contactEmail: normalizedEmail,
      location: String(location || "").trim(),
      latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
      longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
    });

    const librarian = await Librarian.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await hashPassword(password),
      role: "admin",
      phone: String(phone || "").trim(),
      libraryId: library._id,
    });

    await seedDemoStudents(library._id);
    const dashboard = await buildLibraryDashboard(library._id);

    // Send welcome email (non-blocking — don't fail registration if email fails)
    sendWelcomeEmail({
      to: normalizedEmail,
      librarianName: name.trim(),
      libraryName: libraryName.trim(),
    }).catch((err) => console.error("Welcome email failed:", err.message));

    const session = {
      role: "admin",
      libraryId: library._id,
      librarianId: librarian._id,
    };

    return res.status(201).json({
      message: "Library created successfully",
      session,
      token: createSessionToken(session),
      librarian: {
        id: librarian._id,
        name: librarian.name,
        email: librarian.email,
        role: librarian.role,
        libraryId: librarian.libraryId,
      },
      library,
      dashboard,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate value detected",
        fields: error.keyValue,
      });
    }

    return res.status(500).json({
      message: "Unable to register library",
      error: error.message,
    });
  }
};

exports.getLibraries = async (_req, res) => {
  try {
    const libraries = await Library.find().sort({ createdAt: -1 });

    return res.json(libraries);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch libraries",
      error: error.message,
    });
  }
};
