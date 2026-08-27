import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { getErrorExplaination } from '../controller/error.controller.js'

const router = express.Router()

/**
 * @route POST /api/error/explain
 * @desc Explain error comes when deployment
 * @access Private
 */
router.post('/explain', protect, getErrorExplaination)

export default router