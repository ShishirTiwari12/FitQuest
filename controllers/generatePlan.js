const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const UserInput = require("../models/UserInput");
const JSON5 = require("json5");
const planFormat = require("../utils/fitnessPlanFormat");
const FitnessPlan = require("../models/FitnessPlan");
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
const UserStats = require("../models/UserStats");

const generatePlan = async (req, res) => {
  try {
    const existingPlan = await FitnessPlan.findOne({ user_id: req.user.id });
    if (existingPlan) {
      return res.status(200).json({
        message: "fitness_plan_exists",
        successful: false,
        view_url: "/api/plan/view-plan",
      });
    }
    const existingInput = await UserInput.findOne({ user_id: req.user.id });
    if (!existingInput)
      return res
        .status(400)
        .json({ message: "create_user_input_first", successful: false });

    console.log("generating plan");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      response_mime_type: "application/json",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a fitness coach AI.
Generate a 7-day personalized fitness plan in EXACTLY this structure:
${JSON.stringify(planFormat)}
USER INPUT:
${JSON.stringify(existingInput)}
Output ONLY valid JSON. Remember that one challenge must be photo upload you cannot remove it.`,
            },
          ],
        },
      ],
    });

    const rawText = await response.text;
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const extractedResponse = JSON.parse(cleaned);

    const newFitnessPlan = new FitnessPlan({
      user_id: req.user.id,
      plan: extractedResponse,
      startDate: new Date(),
    });
    console.log(newFitnessPlan);
    await newFitnessPlan.save();

    return res.status(200).json({
      data: {
        plan: extractedResponse,
        startDate: newFitnessPlan.startDate,
        completedChallenges: [],
      },
      successful: true,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      message: err.message,
      successful: false,
    });
  }
};

const viewPlan = async (req, res) => {
  try {
    const plan = await FitnessPlan.findOne({ user_id: req.user.id });
    if (!plan)
      return res
        .status(404)
        .json({ message: "create_plan_first", successful: false });

    if (!plan.startDate) {
      plan.startDate = plan.createdAt;
      await plan.save();
    }

    const planObject = plan.toObject();
    return res.status(200).json({
      data: {
        plan: planObject.plan,
        startDate: planObject.startDate,
        completedChallenges: planObject.completedChallenges || [],
      },
      successful: true,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", successful: false });
  }
};

// NEW: Delete fitness plan + user input
const deletePlan = async (req, res) => {
  try {
    const deletedPlan = await FitnessPlan.deleteOne({ user_id: req.user.id });
    if (deletedPlan.deletedCount === 0)
      return res
        .status(404)
        .json({ message: "no_plan_found", successful: false });

    // Delete user input so they can create a fresh one
    await UserInput.deleteOne({ user_id: req.user.id });

    // Reset only challenge completion data — preserve score, streak, longestStreak
    await UserStats.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          completedChallenges: [], // fixes the "already completed" bug
          challengesCompleted: 0, // reset counter for new plan
          photoUploads: 0, // reset counter for new plan
          perfectDays: 0, // reset counter for new plan
          lastActiveDate: null, // so streak logic starts fresh for new plan
        },
      },
    );

    return res.status(200).json({
      message: "plan_erased",
      successful: true,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      message: "something went wrong. Please try again later.",
      successful: false,
    });
  }
};

module.exports = { generatePlan, viewPlan, deletePlan };
