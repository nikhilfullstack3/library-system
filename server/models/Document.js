const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["verified", "pending review"],
      default: "verified",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ libraryId: 1, createdAt: -1 });
documentSchema.index({ libraryId: 1, status: 1, createdAt: -1 });
documentSchema.index({ libraryId: 1, studentId: 1, createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);
