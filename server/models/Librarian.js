const mongoose = require("mongoose");

const librarianSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "librarian"],
      default: "librarian",
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    chatEnabled: {
      type: Boolean,
      default: true,
    },
    libraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

librarianSchema.index({ libraryId: 1, createdAt: -1 });
librarianSchema.index({ libraryId: 1, role: 1, createdAt: -1 });

module.exports = mongoose.model("Librarian", librarianSchema);
