const Librarian = require("../models/Librarian");
const Student = require("../models/Student");
const SuperAdmin = require("../models/SuperAdmin");
const { verifyPassword } = require("../utils/password");
const { createSessionToken } = require("../utils/sessionToken");
exports.loginLibrarian = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const librarian = await Librarian.findOne({
      email: email.trim().toLowerCase(),
    }).populate("libraryId");

    if (!librarian) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await verifyPassword(password, librarian.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const session = {
      role: librarian.role,
      libraryId: librarian.libraryId?._id || librarian.libraryId,
      librarianId: librarian._id,
    };

    return res.json({
      message: "Login successful",
      session,
      token: createSessionToken(session),
      librarian: {
        id: librarian._id,
        name: librarian.name,
        email: librarian.email,
        phone: librarian.phone,
        role: librarian.role,
        library: librarian.libraryId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to login",
      error: error.message,
    });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const identifier = email.trim().toLowerCase();
    const student = await Student.findOne({
      $or: [{ email: identifier }, { loginId: identifier }],
    }).populate("libraryId");

    if (!student) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!student.loginEnabled) {
      return res.status(403).json({
        message: "Login will be issued after payment is marked paid",
      });
    }

    const passwordMatches = await verifyPassword(password, student.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const session = {
      role: "student",
      libraryId: student.libraryId?._id || student.libraryId,
      studentId: student._id,
    };

    return res.json({
      message: "Login successful",
      session,
      token: createSessionToken(session),
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        library: student.libraryId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to login",
      error: error.message,
    });
  }
};

exports.loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const superAdmin = await SuperAdmin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!superAdmin) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await verifyPassword(password, superAdmin.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const session = {
      role: "super_admin",
      superAdminId: superAdmin._id,
    };

    return res.json({
      message: "Login successful",
      session,
      token: createSessionToken(session),
      superAdmin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to login",
      error: error.message,
    });
  }
};
