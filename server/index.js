require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");
const authRoutes = require("./routes/authRoutes");
const { createDefaultLibrary } = require("./controllers/dashboardControllers");
const { setIO } = require("./socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/library-system";
const rateWindowMs = 60 * 1000;
const rateLimit = Number(process.env.RATE_LIMIT_PER_MINUTE || 600);
const requestCounts = new Map();

setIO(io);

async function configureSocketScaling() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return;
  }

  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect().catch(() => {}), subClient.connect().catch(() => {})]);
  io.adapter(createAdapter(pubClient, subClient));
  console.log("Socket.IO Redis adapter enabled");
}

io.on("connection", (socket) => {
  socket.on("library:join", (libraryId) => {
    if (!libraryId) {
      return;
    }

    socket.join(`library:${libraryId}`);
  });

  socket.on("library:leave", (libraryId) => {
    if (!libraryId) {
      return;
    }

    socket.leave(`library:${libraryId}`);
  });
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + rateWindowMs });
    return next();
  }

  if (entry.count >= rateLimit) {
    return res.status(429).json({ message: "Too many requests. Try again shortly." });
  }

  entry.count += 1;
  return next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const start = async () => {
  try {
    await mongoose.connect(mongoUri);
    await configureSocketScaling();
    await createDefaultLibrary();
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = { app, start, server };
