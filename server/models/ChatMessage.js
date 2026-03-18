const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    libraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ["admin", "librarian", "student"],
      required: true,
    },
    tag: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentName: {
      type: String,
      trim: true,
      default: "",
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: "",
    },
    attachmentType: {
      type: String,
      enum: ["", "image", "document"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ libraryId: 1, createdAt: -1 });
chatMessageSchema.index({ libraryId: 1, senderId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
