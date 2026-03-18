const { verifySessionToken } = require("../utils/sessionToken");

function getBearerToken(header = "") {
  const [type, token] = String(header).split(" ");
  if (type !== "Bearer" || !token) {
    return "";
  }
  return token;
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);
  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.params.libraryId && session.role !== "super_admin" && String(req.params.libraryId) !== String(session.libraryId)) {
    return res.status(403).json({ message: "You do not have access to this library" });
  }

  req.auth = session;
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    return next();
  };
}

function requireStudentSelf(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.auth.role !== "student") {
    return res.status(403).json({ message: "Student access required" });
  }

  if (req.params.studentId && String(req.params.studentId) !== String(req.auth.studentId)) {
    return res.status(403).json({ message: "You can only access your own profile" });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireStudentSelf,
};
