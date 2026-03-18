const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
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
    month: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
      required: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ libraryId: 1, createdAt: -1 });
paymentSchema.index({ libraryId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ libraryId: 1, studentId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);
