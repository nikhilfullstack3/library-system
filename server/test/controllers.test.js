const test = require("node:test");
const assert = require("node:assert/strict");
const Librarian = require("../models/Librarian");
const Student = require("../models/Student");
const { registerLibrary } = require("../controllers/authControllers");
const { loginLibrarian, loginStudent } = require("../controllers/loginControllers");

function createResponse() {
  return {
    body: null,
    statusCode: 200,
    json(payload) {
      this.body = payload;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
  };
}

test("registerLibrary returns 400 when required fields are missing", async () => {
  const res = createResponse();

  await registerLibrary({ body: { name: "Admin" } }, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /required/);
});

test("registerLibrary returns 409 when librarian email already exists", async (t) => {
  const originalFindOne = Librarian.findOne;
  t.after(() => {
    Librarian.findOne = originalFindOne;
  });

  Librarian.findOne = async () => ({ _id: "existing" });

  const res = createResponse();
  await registerLibrary(
    {
      body: {
        name: "Admin",
        email: "admin@example.com",
        password: "admin123",
        libraryName: "My Library",
      },
    },
    res
  );

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /already exists/i);
});

test("loginLibrarian returns 400 when email or password is missing", async () => {
  const res = createResponse();

  await loginLibrarian({ body: { email: "" } }, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /required/);
});

test("loginStudent returns 400 when email or password is missing", async () => {
  const res = createResponse();

  await loginStudent({ body: { password: "" } }, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /required/);
});

test("loginStudent returns 403 when student login is disabled", async (t) => {
  const originalFindOne = Student.findOne;
  t.after(() => {
    Student.findOne = originalFindOne;
  });

  Student.findOne = () => ({
    populate: async () => ({
      _id: "student-1",
      loginEnabled: false,
      libraryId: { _id: "library-1" },
    }),
  });

  const res = createResponse();
  await loginStudent({ body: { email: "student@example.com", password: "student123" } }, res);

  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /payment is marked paid/i);
});
