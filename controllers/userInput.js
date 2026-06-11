const UserInput = require("../models/UserInput");

const createUserInput = async (req, res) => {
  //read the inputs from req.body
  //add those inputs to database
  console.log(req.user);

  const {
    age,
    gender,
    height,
    weight,
    goal,
    equipmentAccess,
    dietaryPreference,
  } = req.body.userInput;

  if (
    !age ||
    !gender ||
    !height ||
    !weight ||
    !goal ||
    !equipmentAccess ||
    !dietaryPreference
  )
    return res.status(400).json({
      message: "missing_required_fields",
      successful: false,
    });

  if (!req.body.userInput.activityLevel) {
    req.body.userInput.activityLevel = "moderately_active";
  }
  if (!req.body.userInput.fitnessLevel) {
    req.body.userInput.fitnessLevel = "beginner";
  }
  if (!req.body.userInput.daysPerWeek) {
    req.body.userInput.daysPerWeek = "flexible";
  }
  if (req.body.userInput.durationPerDay) {
    req.body.userInput.durationPerDay = Number(
      req.body.userInput.durationPerDay
    );
  }
  if (!req.body.userInput.durationPerDay) {
    req.body.userInput.durationPerDay = "flexible";
  }
  if (!req.body.userInput.mealsPerDay) {
    req.body.userInput.mealsPerDay = "flexible";
  }

  try {
    const existingInput = await UserInput.findOne({ user_id: req.user.id });
    console.log(existingInput);
    if (existingInput)
      return res
        .status(400)
        .json({ message: "user_input_already_exists", successful: false });
    const newUserInput = new UserInput({
      user_id: req.user.id,
      ...req.body.userInput,
    });
    console.log(newUserInput);
    await newUserInput.save();
    console.log("user input saved to database");

    return res.status(200).json({ successful: true });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      message: "Network error. Please try again later.",
      successful: false,
    });
  }
};

const viewUserInput = async (req, res) => {
  //read user id from req object
  //fetch data from database and send response to the client
  try {
    console.log("we are here ");
    const userInput = await UserInput.findOne({ user_id: req.user.id });
    console.log(userInput);
    if (!userInput)
      return res
        .status(400)
        .json({ message: "create_user_input_first", successful: false });

    return res.status(200).json({ data: userInput, successful: true });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      message: "something went wrong. Please try again later.",
      successful: false,
    });
  }
};

const updateUserInput = async (req, res) => {
  //get the field + value to be updated from req.body
  //update only those fields

  const { updatedFields } = req.body;
  try {
    const updatedUserInput = await UserInput.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updatedFields }
    );
    if (!updatedUserInput)
      return res
        .status(400)
        .json({ message: "create_user_input_first", successful: false });
    return res
      .status(200)
      .json({ message: "user_input_updated", successful: true });
  } catch (err) {
    return res.status(500).json({
      message: "something went wrong.Please try again later",
      successful: false,
    });
  }
};

const deleteUserInput = async (req, res) => {
  try {
    const deleted = await UserInput.deleteOne({ user_id: req.user.id });
    if (deleted.deletedCount === 0)
      return res
        .status(400)
        .json({ message: "no_user_input_found", successful: false });
    return res.status(200).json({ successful: true });
  } catch (err) {
    return res.status(500).json({
      message: "something went wrong. Please try again later",
      successful: false,
    });
  }
};

module.exports = {
  createUserInput,
  viewUserInput,
  updateUserInput,
  deleteUserInput,
};
