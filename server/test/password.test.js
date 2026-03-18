const test = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, verifyPassword } = require("../utils/password");

test("hashPassword creates a verifiable password hash", async () => {
  const hashed = await hashPassword("admin123");

  assert.notEqual(hashed, "admin123");
  assert.equal(await verifyPassword("admin123", hashed), true);
});

test("verifyPassword rejects the wrong password", async () => {
  const hashed = await hashPassword("student123");

  assert.equal(await verifyPassword("wrong-pass", hashed), false);
});

test("verifyPassword rejects malformed stored values", async () => {
  assert.equal(await verifyPassword("anything", "invalid-format"), false);
});
