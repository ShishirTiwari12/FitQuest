const mongoose = require("mongoose");

const userInputSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    age: { type: Number, required: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      trim: true,
      required: true,
    },
    height: { type: Number, required: true }, // in cm eg. 170 cm
    weight: { type: Number, required: true }, //in kg
    goal: {
      type: String,
      enum: [
        "muscle_gain",
        "weight_loss",
        "strength_building",
        "endurance",
        "flexibility",
        "body_recomposition",
      ],
      trim: true,
      required: true,
    },
    activityLevel: {
      type: String,
      enum: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extra_active",
      ],
      trim: true,
      default: "moderately_active",
    },
    fitnessLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      trim: true,
      default: "beginner",
    },
    daysPerWeek: {
      type: mongoose.Schema.Types.Mixed,
      validate: {
        validator: function (value) {
          return (
            (typeof value === "number" && value >= 1 && value <= 7) ||
            value === "flexible"
          );
        },
        message: "days_per_week must be a number between 1 and 7 or 'flexible'",
      },
      default: "flexible",
    },
    durationPerDay: {
      type: mongoose.Schema.Types.Mixed,
      validate: {
        validator: function (value) {
          return (
            (typeof value === "number" && value >= 1 && value <= 600) ||
            value === "flexible"
          );
        },
        message:
          "duration_per_day must be a number between 1 and 600 or 'flexible'",
      },
      default: "flexible",
    },
    equipmentAccess: {
      type: String,
      enum: {
        values: ["bodyweight", "gym_access", "limited_access"],
        message:
          "{VALUE} can only be one of ('bodyweight', 'gym_access', 'limited_access')",
      },
      trim: true,
      required: true,
    },
    limitedEquipments: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: {
        validator: function (value) {
          // this validator makes sure that if equipment_access is selected to "limited_access" then  user must specify some equipments i.e array cannot be empty
          if (this.equipment_access === "limited_access") {
            return Array.isArray(value) && value.length > 0;
          }
          return true;
        },
      },
    }, // list of equipments if equipment_access = limited_access
    dietaryPreference: {
      type: String,
      enum: ["vegetarian", "non_vegetarian", "vegan"],
      trim: true,
      required: true,
    },
    availableFoodItems: {
      type: [{ type: String, trim: true }],
      default: [],
    }, // stores the list of items available for daily diet
    mealsPerDay: {
      type: mongoose.Schema.Types.Mixed,
      validate: {
        validator: function (value) {
          return (
            (typeof value === "number" && value > 0) || value === "flexible"
          );
        },
        message:
          "{VALUE} cannot be other than  number greater than 0 or 'flexible' ",
      },
      default: 3,
    },
    foodRestrictions: { type: [{ type: String, trim: true }], default: [] }, // list of restricted food
  },
  { timestamps: true }
);

const UserInput = mongoose.model("UserInput", userInputSchema);

module.exports = UserInput;
