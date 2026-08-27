import express from 'express'
import { isAdmin } from '../middleware/auth.middleware.js'
import {
  deleteProjectById,
  getAllProjects,
  getAllUsers,
} from "../controller/admin.controller.js";

const router = express.Router()

/**
 * @route GET /api/admin/users
 * @desc Get all users 
 * @access Admin only (Private)
 */
router.get('/users', isAdmin, getAllUsers)

/**
 * @route GET /api/admin/projects
 * @desc Get all projects 
 * @access Admin only (Private)
 */
router.get('/projects', isAdmin, getAllProjects)

/**
 * @route DELETE /api/admin/project/:projectId
 * @desc Delete a particular project
 * @access Admin only (Private)
 */
router.delete("/project/:projectId", isAdmin, deleteProjectById);

export default router