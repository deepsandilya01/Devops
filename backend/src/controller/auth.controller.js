import jwt from "jsonwebtoken";
import User from "../model/user.model.js";
import config from "../config/config.js";
import redisClient from "../config/redis.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE || "3h",
  });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
export async function register(req, res, next) {
  try {
    const { fullName, email, password, contact } = req.body;

    if (!fullName || !email || !password || !contact) {
      return next({
        status: 400,
        message: "Please provide name, email, and password, contact",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { contact }] });
    if (user) {
      return next({
        status: 409,
        message:
          user.email === email
            ? "User already exists with this email"
            : "User already exists with this contact",
      });
    }

    //Create user
    user = await User.create({
      fullName,
      email,
      password,
      contact,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: config.NODE_ENV === "production" ? true : false,
    });

    res.status(201).json({
      message: "User Registered Succesfully",
      user: {
        email,
        fullName,
        contact,
        tier: user.tier,
        role: user.role,
      },
      success: true,
    });
  } catch (error) {
    return next({
      status: error.response?.status || 400,
      message: error.response?.data?.message || error.message || "Something went wrong",
    });
  }
}

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return next({
        status: 400,
        message: "Please provide email and password",
      });
    }

    // Check for user (include password field since it's hidden by default)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next({ status: 401, message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next({ status: 401, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: config.NODE_ENV === "production" ? true : false,
    });

    res.status(200).json({
      message: "Login Succesfully",
      user: {
        fullName: user.fullName,
        email: user.email,
        contact: user.contact,
        tier: user.tier,
        role: user.role,
      },
      success: true,
    });
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Something went wrong",
    });
  }
}

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/get-me
 * @access  Private
 */
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next({ status: 404, message: "User not found" });
    }

    res.status(200).json({
      message: "User fetched Succesfull",
      success: true,
      user: {
        fullName: user.fullName,
        email: user.email,
        contact: user.contact,
        tier: user.tier,
        role: user.role,
      },
    });
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Something went wrong",
    });
  }
}

/**
 * @desc    Logout user (blacklist token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export async function logout(req, res, next) {
  try {
    const token = req.token;

    if (!token) {
      return next({ status: 400, message: "No token provided" });
    }

    // Decode token to get expiration time
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    if (expiresIn > 0) {
      // Add token to blacklist in Redis with expiration time
      // When token expires, it will be automatically removed from Redis
      await redisClient.setEx(
        `blacklist_${token}`,
        expiresIn,
        JSON.stringify({ reason: "logged_out", timestamp: new Date() }),
      );
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Something went wrong",
    });
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { password, contact, fullName } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return next({ status: 404, message: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (contact) user.contact = contact;
    if (password) user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: user,
    });
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Something went wrong",
    });
  }
}

export async function githubCallback(req, res) {
  const user = req.user;

  const token = generateToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production" ? true : false,
  });

  res.redirect("https://quicklive.tech/dashboard");
}

