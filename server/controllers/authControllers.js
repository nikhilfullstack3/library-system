const Librarian = require("../models/Librarian");
const Library = require("../models/Library");
const { hashPassword } = require("../utils/password");
const { buildLibraryDashboard, seedDemoStudents } = require("./dashboardControllers");

exports.registerLibrary = async (req, res) => {
  try {
    const { name, email, password, libraryName } = req.body;

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
    });

    const librarian = await Librarian.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await hashPassword(password),
      role: "admin",
      libraryId: library._id,
    });

    await seedDemoStudents(library._id);
    const dashboard = await buildLibraryDashboard(library._id);

    return res.status(201).json({
      message: "Library created successfully",
      session: {
        role: "admin",
        libraryId: library._id,
      },
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
