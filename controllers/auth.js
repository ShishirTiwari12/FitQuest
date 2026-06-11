const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Token = require("../models/Token");
const transporter = require("../config/mailer");
const PasswordResetToken = require("../models/PasswordResetToken");
const port = require("../index");

const UserStats = require("../models/UserStats");

const signup = async (req, res) => {
  const { username, email, password } = req.body.inputField;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "All fields (username, email, password) are required",
      successful: false,
    });
  }

  try {
    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already registered", successful: false });
    }

    // Create user
    const newUser = new User({ username, email, password });

    // Wrap save in try/catch to handle post-save hook errors
    try {
      await newUser.save();
    } catch (saveErr) {
      console.error("Error saving new user:", saveErr);
      if (saveErr.code === 11000) {
        return res.status(400).json({
          message: "Username or email already taken",
          successful: false,
        });
      }
      return res.status(500).json({
        message: "Failed to create user. Try again later.",
        successful: false,
      });
    }

    // Generate email verification token
    const token = jwt.sign({ id: newUser._id }, process.env.EMAIL_JWT_SECRET, {
      expiresIn: "1h",
    });
    const verificationLink = `${process.env.BASE_URL}/verify/${token}`;

    // Send email (await ensures errors are caught)
    try {
      await transporter.sendMail({
        from: `FitQuest`,
        to: email,
        subject: "Email verification",
        html: `
          <h3>Welcome to FitQuest!</h3>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationLink}">${verificationLink}</a>
        `,
      });
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr);
      // Optional: still return success so user can try login, but warn them
      return res.status(201).json({
        message:
          "User created, but failed to send verification email. Contact support.",
        successful: true,
      });
    }

    return res.status(201).json({
      message: "User created. Verify your email to continue.",
      successful: true,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      message: "Something went wrong. Please try again later",
      successful: false,
    });
  }
};

const login = async (req, res) => {
  //take user details from body
  //check if credentials are valid or not
  //also check if user is verified or not
  //Generate access token and refresh token
  //send tokens to the client

  const { email, password } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ message: "you must provide email", successful: false });
  if (!password)
    return res
      .status(400)
      .json({ message: "you must provide password", successful: false });
  try {
    const user = await User.findOne({ email: email });
    if (!user)
      return res.status(400).json({
        message: "invalid credentials",
        successful: false,
      });
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(401)
        .json({ message: "invalid credentials", successful: false });
    if (!user.isVerified)
      return res.status(403).json({
        message: "account not verfied. Please check verification email",
        successful: false,
      });
    const accessToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: "1h" },
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: "7d" },
    );
    //check if any  referesh token exists for user: if yes delete it and then only  add new one
    const isTokenAlreadyExists = await Token.findOne({ user_id: user._id });
    if (isTokenAlreadyExists) {
      await Token.deleteOne({ user_id: user._id });
    }

    //add  token to database
    const token = new Token({ token: refreshToken, user_id: user._id });
    await token.save();

    //attach refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      successful: true,
      accessToken,
      username: user.username,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Network error. Please try again later",
      successful: false,
    });
  }
};

//handle forgot password feature
// const forgotPassword = async (req, res) => {
//   const email = req.body.email;
//   try {
//     const existingEmail = await User.findOne({ email: email });
//     if (!existingEmail)
//       return res
//         .status(400)
//         .json({ message: "email not registered", successful: false });
//     const existingToken = await PasswordResetToken.findOne({
//       user_email: email,
//     });
//     if (existingToken) {
//       await PasswordResetToken.deleteOne({ user_email: email });
//     }

//     //generate jwt token
//     const token = jwt.sign(
//       { email: email },
//       process.env.RESET_PASSWORD_JWT_SECRET,
//       {
//         expiresIn: "15m",
//       }
//     );

//     //save token to database
//     const passwordResetToken = new PasswordResetToken({
//       token: token,
//       user_email: email,
//     });
//     await passwordResetToken.save();

//     //send reset link via email
//     await transporter.sendMail({
//       from: `FitQuest`,
//       to: email,
//       subject: "Reset your password",
//       html: `
//         <p>Reset your password  by clicking the link below:</p>
//         <a href="http://localhost:3000/auth/change-password/${token}">Click here</a>

//       `,
//     });
//     return res.status(200).json({ successful: true });
//   } catch (err) {
//     console.log(err.message);

//     return res.status(500).json({
//       message: "Network error. Please try again later",
//       successful: false,
//     });
//   }
// };

// //controller to change password
// const changePassword = async (req, res) => {
//   //get token from query parameters
//   const token = req.params.token;

//   const password = req.body.password;
//   if (!token)
//     return res.status(400).json({
//       successful: false,
//       message: "password reset token not provided",
//     });
//   try {
//     //verify token
//     const decoded = jwt.verify(token, process.env.RESET_PASSWORD_JWT_SECRET);
//     //update the password of the user
//     const user = await User.findOne({ email: decoded.email });
//     if (!user)
//       return res
//         .status(400)
//         .json({ successful: false, message: "user does not exist" });
//     user.password = password;
//     await user.save();
//     //delete the token from database
//     await PasswordResetToken.deleteOne({ user_email: decoded.email });
//     return res
//       .status(200)
//       .json({ message: "password changed succcesfully", successful: true });
//   } catch (err) {
//     console.log(err.message);
//     if (err.name === "TokenExpiredError") {
//       return res
//         .status(400)
//         .json({ successful: false, message: "token expired" });
//     }
//     if (err.name === "JsonWebTokenError") {
//       return res
//         .status(400)
//         .json({ successful: false, message: "invalid token" });
//     }
//     return res
//       .status(500)
//       .json({ message: "Network error. Please try again", successful: false });
//   }
// };

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res
        .status(400)
        .json({ message: "Email not registered", successful: false });

    // Remove any previous tokens
    await PasswordResetToken.deleteMany({ user_email: email });

    // Generate JWT token
    const token = jwt.sign({ email }, process.env.RESET_PASSWORD_JWT_SECRET, {
      expiresIn: "15m",
    });

    // Save token to DB
    const passwordResetToken = new PasswordResetToken({
      token,
      user_email: email,
    });
    await passwordResetToken.save();

    // Send reset link email
    const resetLink = `http://localhost:3000/auth/change-password/${token}`;
    await transporter.sendMail({
      from: "FitQuest <no-reply@fitquest.com>",
      to: email,
      subject: "Reset your password",
      html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    return res
      .status(200)
      .json({ message: "Reset link sent", successful: true });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Network error. Try again later", successful: false });
  }
};

// Change password
const changePassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token)
    return res
      .status(400)
      .json({ successful: false, message: "Token not provided" });

  try {
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user)
      return res
        .status(400)
        .json({ successful: false, message: "User does not exist" });

    user.password = password;
    await user.save();

    // Delete token
    await PasswordResetToken.deleteOne({ user_email: decoded.email });

    return res
      .status(200)
      .json({ message: "Password changed successfully", successful: true });
  } catch (err) {
    console.error(err);
    if (err.name === "TokenExpiredError")
      return res
        .status(400)
        .json({ successful: false, message: "Token expired" });
    if (err.name === "JsonWebTokenError")
      return res
        .status(400)
        .json({ successful: false, message: "Invalid token" });

    return res
      .status(500)
      .json({ message: "Network error. Try again", successful: false });
  }
};

//controller to handle refreshing tokens
const refreshTokenController = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res
      .status(401)
      .json({ message: "No refresh token found", successful: false });

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET_KEY,
    );
    const isTokenInDatabase = await Token.findOne({ token: refreshToken });
    if (!isTokenInDatabase)
      return res
        .status(400)
        .json({ message: "invalid token", successful: false });
    //delete previous refresh token from database
    await Token.deleteOne({ user_id: decoded.id });
    //create new access token and refresh tokens and send them to client
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: "1h" },
    );
    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      process.env.REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: "7d" },
    );
    //add it to databse
    const token = new Token({ token: newRefreshToken, user_id: decoded.id });
    await token.save();

    //attach refreshToken in cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    //send response
    return res.status(200).json({ successful: true, accessToken });
  } catch (err) {
    return res.status(500).json({
      message: "something went wrong. Please try again later",
      successful: false,
    });
  }
};

const logout = async (req, res) => {
  //remove refresh token from database
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res
      .status(401)
      .json({ message: "no refresh token found", successful: false });
  try {
    await Token.deleteOne({ token: refreshToken });
    //clean cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res
      .status(200)
      .json({ successful: true, message: "logged out  successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "something went wrong.please try again later",
      successful: false,
    });
  }
};

const verifyToken = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.EMAIL_JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(400).json({
        message: " invalid token or token expired ",
        successful: false,
      });

    user.isVerified = true;
    await user.save();
    // return res.status(200).json({
    //   successful: true,
    // });
    return res.redirect(`/auth/email-verified`);
    //     res.send(`
    //   <html>
    //     <body>
    //       <h1>Email Verified Successfully!</h1>
    //       <p>You can now <a href="/signin">login</a>.</p>
    //       <script>
    //         // optional auto-redirect to frontend
    //         window.location.href = "/signin";
    //       </script>
    //     </body>
    //   </html>
    // `);
  } catch (err) {
    if (err.name == "TokenExpiredError")
      return res
        .status(401)
        .json({ message: "token expired", successful: false });
    return res.status(500).json({
      message: " something went wrong. Please try again later",
      successful: false,
    });
  }
};

const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ message: "email must be provided", successful: false });
  try {
    const user = await User.findOne({ email: email });
    if (!user)
      return res.status(400).json({
        message: "email not registered. You have to signup first",
        successful: false,
      });
    if (user.isVerified)
      return res.status(400).json({
        message: "email already verified. you can login",
        successful: false,
      });

    const token = jwt.sign({ id: user._id }, process.env.EMAIL_JWT_SECRET, {
      expiresIn: "1h",
    });
    const verificationLink = `${process.env.BASE_URL}/verify/${token}`;
    await transporter.sendMail({
      from: `FitQuest`,
      to: email,
      subject: "Email verification",
      html: `
      <h3>Welcome to FitQuest!</h3>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `,
    });
    return res.status(200).json({
      message: "verification link sent. Check your email",
      successful: true,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", successful: flase });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({
        successful: false,
        message: "User not found",
      });
    }

    const stats = await UserStats.findOne({ user: user._id }).lean();

    if (!stats) {
      return res.json({
        successful: true,
        data: {
          username: user.username,
          score: 0,
          challengesCompleted: 0,
          photoUploads: 0,
          completedChallenges: [],
        },
      });
    }

    res.json({
      successful: true,
      data: {
        username: user.username,
        score: stats.score,
        challengesCompleted: stats.challengesCompleted,
        photoUploads: stats.photoUploads,
        completedChallenges: stats.completedChallenges,
      },
    });
  } catch (err) {
    console.error("Public profile error:", err);
    res.status(500).json({
      successful: false,
      message: "Failed to fetch profile",
    });
  }
};

module.exports = {
  signup,
  login,
  refreshTokenController,
  logout,
  verifyToken,
  resendVerification,
  forgotPassword,
  changePassword,
  getPublicProfile,
};
