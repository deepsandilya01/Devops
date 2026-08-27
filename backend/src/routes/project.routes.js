import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  deployProject,
  getLogs,
  streamLogs,
  getProjects,
  getProjectByAppId,
  getContainerStats,
  analyzeRepo,
  getProjectSummery,
  deleteProject,
  redeployProject
} from "../controller/project.controller.js";

const router = Router();

/**
 * @route GET /api/project/all
 * @desc Get all Projects of user
 * @access Private
 */
router.get("/all", protect, getProjects);

/**
 * @route POST /api/project/deploy
 * @desc Deploy a Project
 * @access Private
 */
router.post("/deploy", protect, deployProject);

/**
 * @route GET /api/project/logs/:appId
 * @desc Get logs of a Project
 * @access Private
 */
router.get("/logs/:appId", protect, getLogs);

/**
 * @route GET /api/project/logs/:appId/stream
 * @desc Stream logs of a Project via SSE
 * @access Private
 */
router.get("/logs/:appId/stream", protect, streamLogs);

/**
 * @route POST /api/project/analyze
 * @desc Analyze a repository
 * @access Private
 */
router.post("/analyze", protect, analyzeRepo);

/**
 * @route GET /api/project/summary/:id
 * @desc Get project summary
 * @access Private
 */
router.get("/summary/:id", protect, getProjectSummery);

/**
 * @route GET /api/project/:appId
 * @desc Get a single project by appId
 * @access Private
 */
router.get("/:appId", protect, getProjectByAppId);

/**
 * @route GET /api/project/:appId/stats
 * @desc Get container resource stats
 * @access Private
 */
router.get("/:appId/stats", protect, getContainerStats);

/**
 * @route DELETE /api/project/delete
 * @desc Delete a project
 * @access Private
 */
router.delete("/delete", protect, deleteProject);

/**
 * @route POST /api/project/redeploy
 * @desc Redeploy a project
 * @access Private
 */
router.post("/redeploy", protect, redeployProject);

export default router;
