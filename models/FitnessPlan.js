// const mongoose = require("mongoose");

// const warmupSchema = new mongoose.Schema({
//   name: { type: String, trim: true, default: "" },
//   duration: { type: String, trim: true, default: "" },
// });

// const exerciseSchema = new mongoose.Schema({
//   name: { type: String, trim: true, required: true },
//   sets: { type: Number, min: 1, max: 15, required: true },
//   reps: { type: Number, min: 1, max: 200, required: true },
//   load: { type: String, trim: true, default: "" },
// });

// const cooldownSchema = new mongoose.Schema({
//   name: { type: String, trim: true, default: "" },
//   duration: { type: String, trim: true, default: "" },
// });

// const workoutPlanSchema = new mongoose.Schema({
//   type: { type: String, default: "" },
//   warmup: { type: [warmupSchema], default: [] },
//   exercises: { type: [exerciseSchema], required: true },
//   cooldown: { type: [cooldownSchema], default: [] },
//   notes: { type: String, default: "" },
// });

// const foodSchema = new mongoose.Schema({
//   food: { type: String, required: true },
//   quantity: { type: String, required: true },
//   description: { type: String, required: true },
// });

// const mealSchema = new mongoose.Schema({
//   name: { type: String, trim: true, required: true },
//   items: { type: [foodSchema], required: true },
// });

// const hydrationSchema = new mongoose.Schema({
//   goal: { type: String, required: true },
//   reminders: { type: [String], default: [] },
// });

// const dietPlanSchema = new mongoose.Schema({
//   meals: { type: [mealSchema], required: true },
//   hydration: { type: [hydrationSchema], required: true },
//   suggestions: { type: [String], default: [] },
//   general_guidelines: { type: [String], default: [] },
// });

// const planSchema = new mongoose.Schema({
//   day: { type: Number, min: 1, max: 7, required: true },
//   focus: { type: String, trim: true, default: "" },
//   workout: { type: workoutPlanSchema, required: true },
//   diet: { type: dietPlanSchema, required: true },
// });

// const fitnessPlanSchema = new mongoose.Schema(
//   {
//     user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
//     goal: {
//       type: String,
//       enum: [
//         "muscle_gain",
//         "weight_loss",
//         "strength_building",
//         "endurance",
//         "flexibility",
//         "body_recomposition",
//       ],
//       trim: true,
//       required: true,
//     },
//     plan: { type: [planSchema], required: true },
//   },
//   { timestamps: true, strict: false }
// );

// const FitnessPlan = mongoose.model("FitnessPlan", fitnessPlanSchema);
// module.exports = FitnessPlan;

const mongoose = require("mongoose");

const fitnessPlanSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: { type: Array, required: true },
    startDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FitnessPlan", fitnessPlanSchema);
