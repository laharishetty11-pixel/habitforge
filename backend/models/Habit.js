const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["Health", "Work", "Learning", "Personal", "Other"],
    default: "Other",
  },
  note: {
    type: String,
    default: "",
    maxlength: 200,
  },
  completedDates: {
    type: [String],   // array of "YYYY-MM-DD" date strings
    default: [],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Habit", habitSchema);