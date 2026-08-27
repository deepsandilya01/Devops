import axios from "axios";
import config from "../config/config.js";
import { getCacheOrExecute, invalidateCache } from "../utils/cache.utils.js";
import crypto from "crypto";

/**
 * Generates a beginner-friendly project summary using Mistral AI with caching
 * @param {Object} analysisData - Extracted repository analysis data
 * @param {string} analysisData.repoName - Name of the repository
 * @param {Array<string>} analysisData.techStack - Technologies used
 * @param {Array<string>} analysisData.entryPoints - Entry point files
 * @param {Array<Object>} analysisData.folderExplanation - Folder structure with purposes
 * @returns {Promise<string>} AI-generated beginner-friendly summary
 */
export async function generateAISummary(analysisData) {
  const { repoName = "Unknown" } = analysisData;

  // Create cache key based on repo name and tech stack (to differentiate versions)
  const techStackHash = crypto
    .createHash("md5")
    .update(JSON.stringify(analysisData.techStack || []))
    .digest("hex")
    .substring(0, 8);
  const cacheKey = `ai_summary:${repoName}:${techStackHash}`;
  const TTL = 86400 * 7; // Cache for 7 days

  // Use cache or generate new summary
  return await getCacheOrExecute(cacheKey, TTL, () =>
    _generateAISummaryAPI(analysisData),
  );
}

/**
 * Internal function: Generates a beginner-friendly project summary using Mistral AI
 * @param {Object} analysisData - Extracted repository analysis data
 * @returns {Promise<string>} AI-generated beginner-friendly summary
 * @private
 */
async function _generateAISummaryAPI(analysisData) {
  const mistralApiKey = config.MISTRAL_API_KEY;

  if (!mistralApiKey) {
    throw new Error(
      "MISTRAL_API_KEY is not configured. Please set it in environment variables.",
    );
  }

  try {
    const prompt = buildSummaryPrompt(analysisData);

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: `You are a technical mentor explaining code projects to beginners. 
Your goal is to:
1. Explain what this project does in simple, everyday language
2. Explain why each technology is used
3. Explain how to get started
4. Keep explanations short and beginner-friendly (avoid jargon)
5. Be encouraging and positive`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${mistralApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (
      !response.data.choices ||
      !response.data.choices[0] ||
      !response.data.choices[0].message
    ) {
      throw new Error("Invalid response from Mistral API");
    }

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Mistral API Error:", error.message);
    throw new Error(
      `Failed to generate AI summary: ${error.message || "Unknown error"}`,
    );
  }
}

/**
 * Builds a detailed prompt for Mistral AI
 * @param {Object} analysisData - Repository analysis data
 * @returns {string} Formatted prompt
 */
function buildSummaryPrompt(analysisData) {
  const {
    repoName = "Unknown",
    techStack = [],
    entryPoints = [],
    folderExplanation = [],
  } = analysisData;

  const techStackStr =
    techStack.length > 0 ? techStack.slice(0, 15).join(", ") : "Not detected";

  const entryPointsStr =
    entryPoints.length > 0 ? entryPoints.join(", ") : "Not found";

  const folderStructureStr =
    folderExplanation.length > 0
      ? folderExplanation.map((f) => `- ${f.path}: ${f.purpose}`).join("\n")
      : "No clear structure detected";

  return `
I have a code project called "${repoName}" and I need you to explain it to a beginner programmer.

Here's what I know about it:

**Technologies Used (Libraries & Frameworks):**
${techStackStr}

**How to Start the Project:**
Main entry points: ${entryPointsStr}

**Folder Structure:**
${folderStructureStr}

Please provide a beginner-friendly explanation that covers:
1. **What does this project do?** - Explain the main purpose in simple terms
2. **What technologies does it use and why?** - Explain 2-3 key technologies briefly
3. **How would someone use this?** - Explain the basic workflow
4. **Is this for beginners or advanced?** - Assessment of difficulty
5. **Next steps for someone new** - Tips on how to get started

Keep your response friendly, encouraging, and under 250 words.
`;
}

export async function generateErrorExplaination(error, context = "") {
  const mistralApiKey = config.MISTRAL_API_KEY;

  if (!mistralApiKey) {
    throw new Error(
      "MISTRAL_API_KEY is not configured. Please set it in environment variables.",
    );
  }

  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: `You are a deployment error assistant.

Your task is to analyze an error message and return a clear explanation and solution in MARKDOWN format.

Rules:

* Output ONLY Markdown (no JSON, no extra text)
* Keep explanation simple and concise (2–4 lines)
* Provide a clear actionable fix
* Use proper Markdown headings

Format:

## ❌ Error Explanation

<explain what went wrong in simple terms>

## 💡 Fix

<step-by-step solution to fix the error>

---
`,
          },
          {
            role: "user",
            content: `Error: ${error},
            Context: ${context}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${mistralApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (
      !response.data.choices ||
      !response.data.choices[0] ||
      !response.data.choices[0].message
    ) {
      throw new Error("Invalid response from Mistral API");
    }

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    return next({
      status: err.response?.status || 500,
      message:
        err.response?.data?.message || err.message || "Something went wrong",
    });
  }
}
