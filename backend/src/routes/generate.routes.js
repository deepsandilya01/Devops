import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { generateWebsite, getTemplates, previewTemplate, handleChat, handleChatStream } from "../controller/generate.controller.js";

const router = express.Router();

/**
 * @route GET /api/generate/templates
 * @desc Get available website templates
 * @access Private
 */
router.get("/templates", protect, getTemplates);

/**
 * @route GET /api/generate/preview/:templateId
 * @desc Get raw HTML preview of a template
 * @access Private
 */
router.get("/preview/:templateId", protect, previewTemplate);

/**
 * @route POST /api/generate/website
 * @desc Generate a website from template + prompt, push to GitHub
 * @access Private
 */
router.post("/website", protect, generateWebsite);

/**
 * @route POST /api/generate/chat
 * @desc Communicate with the AI assistant
 * @access Private
 */
router.post("/chat", protect, handleChat);

/**
 * @route POST /api/generate/chat/stream
 * @desc Stream AI chat response token-by-token via SSE
 * @access Private
 */
router.post("/chat/stream", protect, handleChatStream);

export default router;
