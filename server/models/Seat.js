const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    libraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true,
    },
    number: {
      type: Number,
      required: true,
      min: 1,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["empty", "occupied"],
      default: "empty",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

seatSchema.index({ libraryId: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
