const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
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
    loginId: {
      type: String,
      trim: true,
      default: undefined,
      unique: true,
      sparse: true,
    },
    issuedPassword: {
      type: String,
      trim: true,
      default: "",
    },
    loginEnabled: {
      type: Boolean,
      default: false,
    },
    profilePhotoName: {
      type: String,
      trim: true,
      default: "",
    },
    profilePhotoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    shift: {
      type: String,
      required: true,
      trim: true,
    },
    shiftTiming: {
      type: String,
      trim: true,
      default: "",
    },
    shiftStartTime: {
      type: String,
      trim: true,
      default: "",
    },
    shiftEndTime: {
      type: String,
      trim: true,
      default: "",
    },
    fullDay: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ["", "cash", "online"],
      default: "",
    },
    documents: {
      type: [String],
      default: [],
    },
    hoursSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentlyInLibrary: {
      type: Boolean,
      default: false,
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

studentSchema.index({ libraryId: 1, seatNumber: 1 }, { unique: true });
studentSchema.index({ libraryId: 1, createdAt: -1 });
studentSchema.index({ libraryId: 1, paymentStatus: 1, createdAt: -1 });
studentSchema.index({ libraryId: 1, currentlyInLibrary: 1 });
studentSchema.index({ libraryId: 1, chatEnabled: 1 });

module.exports = mongoose.model("Student", studentSchema);
