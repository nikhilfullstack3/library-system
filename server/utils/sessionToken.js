const crypto = require("crypto");

const SESSION_SECRET = process.env.SESSION_SECRET || "library-system-dev-secret";

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function createSessionToken(payload) {
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(body));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token = "") {
  const [encodedPayload, signature] = String(token).split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

module.exports = {
  createSessionToken,
  verifySessionToken,
};
