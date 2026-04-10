const mongoose = require("mongoose");

const seatChangeRequestSchema = new mongoose.Schema(
  {
    libraryId: { type: mongoose.Schema.Types.ObjectId, ref: "Library", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    currentSeatId: { type: mongoose.Schema.Types.ObjectId, ref: "Seat", default: null },
    currentSeatNumber: { type: String, default: "" },
    requestedSeatId: { type: mongoose.Schema.Types.ObjectId, ref: "Seat", required: true },
    requestedSeatNumber: { type: String, required: true },
    reason: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Librarian", default: null },
  },
  { timestamps: true }
);

seatChangeRequestSchema.index({ libraryId: 1, status: 1, createdAt: -1 });
seatChangeRequestSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model("SeatChangeRequest", seatChangeRequestSchema);
