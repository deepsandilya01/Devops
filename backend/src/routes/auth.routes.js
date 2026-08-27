import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  githubCallback,
  updateProfile,
} from "../controller/auth.controller.js";
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} from "../validators/auth.validator.js";
import { protect } from "../middleware/auth.middleware.js";
import passport from "passport";

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new User
 * @access Public
 */
router.post("/register", registerValidator, register);

/**
 * @route POST /api/auth/login
 * @desc login a User
 * @access Public
 */
router.post("/login", loginValidator, login);

/**
 * @route GET /api/auth/get-me
 * @desc Get a logged-in User
 * @access Private
 */
router.get("/get-me", protect, getMe);

/**
 * @route POST /api/auth/logout
 * @desc logout User
 * @access Private
 */
router.post("/logout", updateProfileValidator, protect, logout);

/**
 * @route PUT /api/auth/update-profile
 * @desc Update profile
 * @access Private
 */
router.put("/update-profile", protect, updateProfile);

/**
 * @route GET /api/auth/github
 * @desc login / register using Github
 * @access Public
 */
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email", "repo"] }),
);

/**
 * @route GET /api/auth/github/callback
 * @desc Callback after github login
 * @access Private
 */
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "http://localhost:5173/login",
  }),
  githubCallback,
);

export default router;
