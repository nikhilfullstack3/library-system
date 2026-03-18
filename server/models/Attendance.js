const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    libraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    checkIn: {
      type: Date,
      default: Date.now,
      required: true,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ libraryId: 1, studentId: 1, dateKey: 1 }, { unique: true });
attendanceSchema.index({ libraryId: 1, createdAt: -1 });
attendanceSchema.index({ libraryId: 1, dateKey: -1, createdAt: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
