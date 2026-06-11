const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // e.g. "2026-03-15"
  startTime: { type: String, required: true }, // e.g. "10:00"
  endTime: { type: String, required: true }, // e.g. "11:00"
  isBooked: { type: Boolean, default: false },
});

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // for expert dashboard login
    bio: { type: String, required: true, maxlength: 1000 },
    specialization: {
      type: String,
      required: true,
      enum: [
        "Weight Loss",
        "Strength Training",
        "Yoga",
        "Nutrition",
        "Cardio",
        "Mental Wellness",
        "Flexibility",
        "Sports Performance",
      ],
    },
    photo: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    hourlyRate: { type: Number, required: true }, // in NPR
    availableSlots: [slotSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Expert = mongoose.model("Expert", expertSchema);
module.exports = Expert;
