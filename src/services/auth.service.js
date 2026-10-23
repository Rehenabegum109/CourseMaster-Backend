
const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendWelcomeEmail } = require("./email.service");

// Register a new student
const register = async ({ name, email, password }) => {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // Check whether the email is already registered
  const exists = await User.findOne({ email: normalizedEmail });

  if (exists) {
    throw new Error("Email already registered");
  }

  // Hash the password before saving it
  const passwordHash = await bcrypt.hash(password, 10);

  // Public registration always creates a student account.
  // Never trust a role sent by the frontend.
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    role: "student",
  });

  const token = generateToken({
    id: user._id,
    role: user.role,
  });

  // Send welcome email without blocking registration
  sendWelcomeEmail(user.email, user.name).catch((err) => {
    console.error(
      "Email sending failed (non-critical):",
      err.message
    );
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// Login an existing user
const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare the submitted password with the stored bcrypt hash
  const match = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!match) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// Get the currently authenticated user's information
const getMe = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

module.exports = {
  register,
  login,
  getMe,
};
