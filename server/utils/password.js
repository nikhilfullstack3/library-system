const crypto = require("crypto");

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

const scrypt = (value, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(value, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });

exports.hashPassword = async (password) => {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = await scrypt(password, salt);

  return `${salt}:${hash.toString("hex")}`;
};

exports.verifyPassword = async (password, storedPassword) => {
  const [salt, storedHash] = storedPassword.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const hash = await scrypt(password, salt);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== hash.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, hash);
};
