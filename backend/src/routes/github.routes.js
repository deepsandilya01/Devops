import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getAllRepo } from "../controller/github.controller.js";

const router = express.Router();

/**
 * @route GET /api/github/all-repo
 * @desc Fetch all repo of logged In user
 * @access Private
 */
router.get("/all-repo", protect, getAllRepo);

export default router;
