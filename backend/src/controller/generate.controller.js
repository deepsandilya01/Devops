import axios from "axios";
import User from "../model/user.model.js";
import config from "../config/config.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execAsync } from "../utils/deploy.utils.js";

/**
 * POST /api/generate/website
 * Body: { templateId, prompt, repoName }
 *
 * Flow:
 * 1. Use Mistral AI to generate website files based on template + prompt
 * 2. Create a new GitHub repo under the user's account
 * 3. Push the generated files to GitHub
 * 4. Return the repo URL so frontend can trigger deploy
 */
export async function generateWebsite(req, res, next) {
  req.setTimeout(600000);
  res.setTimeout(600000);

  const { templateId, prompt, repoName } = req.body;

  if (!templateId || !prompt || !repoName) {
    return next({
      status: 400,
      message: "templateId, prompt, and repoName are required",
    });
  }

  const sanitizedName = repoName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!sanitizedName) {
    return next({ status: 400, message: "Invalid repository name" });
  }

  try {
    const user = await User.findById(req.user.id).select("+githubAccessToken");

    if (!user || !user.githubAccessToken) {
      return next({
        status: 403,
        message:
          "GitHub is not connected. Please link your GitHub account first.",
      });
    }

    const mistralApiKey = config.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      return next({
        status: 500,
        message: "AI service is not configured (MISTRAL_API_KEY missing).",
      });
    }

    // Step 1: Generate website code with AI
    const generatedFiles = await generateFilesWithAI(
      templateId,
      prompt,
      sanitizedName,
      mistralApiKey,
    );

    // Step 2: Create GitHub repo
    const repoData = await createGitHubRepo(
      sanitizedName,
      prompt,
      user.githubAccessToken,
    );

    // Step 3: Push files to GitHub
    const tempDir = path.resolve(
      `temp/gen_${crypto.randomBytes(4).toString("hex")}`,
    );
    await pushFilesToGitHub(
      generatedFiles,
      repoData,
      tempDir,
      user.githubAccessToken,
    );

    // Cleanup temp dir
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    res.status(201).json({
      success: true,
      repoUrl: repoData.clone_url,
      repoHtmlUrl: repoData.html_url,
      repoName: repoData.name,
      message: "Website generated and pushed to GitHub successfully!",
    });
  } catch (err) {
    console.error("Generate Website Error:", err);
    return next({
      status: err.response?.status || 500,
      message:
        err.response?.data?.message ||
        err.message ||
        "Failed to generate website",
    });
  }
}

/**
 * GET /api/generate/templates
 * Returns available website templates
 */
export function getTemplates(req, res, next) {
  const templates = [
    {
      id: "portfolio",
      name: "Portfolio",
      description:
        "A sleek personal portfolio with hero, about, projects, and contact sections.",
      icon: "👤",
      tags: ["personal", "resume", "showcase"],
      hasTemplate: true,
    },
    {
      id: "landing",
      name: "Landing Page",
      description:
        "A high-conversion landing page with CTA, features, testimonials, and pricing.",
      icon: "🚀",
      tags: ["business", "startup", "marketing"],
      hasTemplate: true,
    },
    {
      id: "blog",
      name: "Blog",
      description:
        "A warm editorial blog with hero post, article list, sidebar, and subscribe form.",
      icon: "📝",
      tags: ["writing", "content", "articles"],
      hasTemplate: true,
    },
    {
      id: "ecommerce",
      name: "E-Commerce",
      description:
        "A minimal storefront with product grid, cart sidebar, filters, and checkout layout.",
      icon: "🛒",
      tags: ["shop", "store", "products"],
      hasTemplate: true,
    },
    {
      id: "agency",
      name: "Creative Agency",
      description:
        "A bold agency site with work portfolio, services, team section, and marquee animations.",
      icon: "🎨",
      tags: ["agency", "creative", "branding"],
      hasTemplate: true,
    },
    {
      id: "custom",
      name: "Custom Site",
      description:
        "Start from scratch — describe any website you want and AI will build it exactly to your vision.",
      icon: "✨",
      tags: ["custom", "ai", "scratch"],
    },
  ];

  res.status(200).json({ success: true, templates });
}

/**
 * GET /api/generate/preview/:templateId
 * Returns the raw HTML of a template for iframe preview
 */
export function previewTemplate(req, res, next) {
  const { templateId } = req.params;
  const templateDir = path.resolve("src/templates");
  const templateFile = path.join(templateDir, `${templateId}.html`);

  if (!fs.existsSync(templateFile)) {
    return next({ status: 404, message: "Template not found" });
  }

  const html = fs.readFileSync(templateFile, "utf-8");
  res.setHeader("Content-Type", "text/html");
  res.send(html);
}

// ─── Internal Helpers ────────────────────────────────────────────────

async function generateFilesWithAI(templateId, prompt, repoName, apiKey) {
  // Try to load a premade template file from disk
  const templateDir = path.resolve("src/templates");
  const templateFile = path.join(templateDir, `${templateId}.html`);
  let templateHtml = null;

  if (fs.existsSync(templateFile)) {
    templateHtml = fs.readFileSync(templateFile, "utf-8");
  }

  // If we have a real template, ask AI to customize it
  if (templateHtml) {
    const systemPrompt = `You are an expert web developer who customizes existing HTML templates based on user requirements.

CRITICAL RULES:
1. Output ONLY valid JSON — no markdown fences, no explanation text
2. The JSON must be an object with a "files" key containing an array: {"files": [{"filename": "index.html", "content": "..."}, ...]}
3. You will receive an existing HTML template. Your job is to CUSTOMIZE it based on the user's prompt
4. Preserve the overall structure, layout, CSS architecture, and design quality of the original template
5. Change: names, titles, descriptions, skills, projects, colors, contact info, stats — anything the user asks for
6. Keep ALL the CSS styles, animations, and responsive design from the original
7. If the user asks for color changes, update the CSS variables in :root
8. Output the complete customized HTML as a single index.html file (keep CSS inline in <style> as the original does)
9. Optionally add a script.js file if interactive features are requested`;

    const userPrompt = `Here is the original template HTML:

\`\`\`html
${templateHtml}
\`\`\`

Now customize this template based on the following requirements:

"${prompt}"

Repository name: "${repoName}"

Return a JSON object with a "files" array. Each file object has "filename" and "content". The main file should be index.html containing the fully customized HTML with inline CSS (same structure as the original). Add a script.js only if needed.`;

    let response;
    try {
      response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err) {
      console.error(
        "Mistral API Error (Premade):",
        err.response?.data || err.message,
      );
      throw new Error(
        `AI Service Error: ${err.response?.data?.message || err.message}`,
      );
    }

    const raw = response.data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response from AI");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try {
        const cleanRaw = raw.replace(/```(json)?/gi, '').trim();
        parsed = JSON.parse(cleanRaw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        let extracted = match ? match[0] : raw;
        try {
          parsed = JSON.parse(extracted);
        } catch {
          const repairSuffixes = ['"]}', '"}', ']', '}', '"}], "assets": []}', '"}]}', '"]}'];
          let repaired = false;
          for (const suffix of repairSuffixes) {
            try {
              parsed = JSON.parse(extracted + suffix);
              repaired = true;
              break;
            } catch (e) { }
          }
          if (!repaired) {
            try {
              const fixedNewlines = extracted.replace(/(?<!\\)\n/g, "\\n").replace(/(?<!\\)\r/g, "");
              parsed = JSON.parse(fixedNewlines);
            } catch {
              throw new Error("AI returned invalid JSON");
            }
          }
        }
      }
    }

    const files = Array.isArray(parsed)
      ? parsed
      : parsed.files || parsed.data || [];
    if (!Array.isArray(files) || files.length === 0) {
      // Fallback: use the original template as-is
      return [{ filename: "index.html", content: templateHtml }];
    }
    return files;
  }

  // No template file found — generate from scratch
  const systemPrompt = `You are an expert web developer. You generate complete, production-ready static websites using HTML, CSS, and vanilla JavaScript only (no frameworks, no npm, no build tools).

CRITICAL RULES:
1. Output ONLY valid JSON — no markdown fences, no explanation text
2. The JSON must be an object with a "files" key containing exactly one file: {"files": [{"filename": "index.html", "content": "..."}]}
3. You MUST output EXACTLY ONE file: index.html.
4. All CSS MUST be inside a <style> tag within the <head> of index.html.
5. All JavaScript MUST be inside a <script> tag at the end of the <body> in index.html.
6. Use modern CSS (flexbox, grid, CSS variables, smooth animations, glassmorphism).
7. Make the design visually STUNNING — use gradients, transitions, hover effects, and responsive layout.
8. The website must be fully responsive (mobile, tablet, desktop).
9. Include proper meta tags, favicon link, and semantic HTML.
10. Use Google Fonts for premium typography.
11. WRITE THE FULL, FUNCTIONAL CODE. DO NOT use placeholders, comments like "CSS goes here", or incomplete blocks. The code must work immediately.
12. To stay within token limits, keep the design minimal but highly polished. Avoid massive inline SVGs or excessively long repeated text.
13. IMPORTANT: You must output STRICTLY VALID JSON. All newlines inside strings must be escaped as \\n.`
  const userPrompt = `Generate a "${templateId}" style website with the following requirements:

"${prompt}"

Repository name: "${repoName}"

Return a JSON object with a "files" array. The array MUST contain EXACTLY ONE file object: "index.html" with the full HTML contents (including inline CSS and JS).`;

  let response;
  try {
    response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error(
      "Mistral API Error (Custom):",
      err.response?.data || err.message,
    );
    throw new Error(
      `AI Service Error: ${err.response?.data?.message || err.message}`,
    );
  }

  const raw = response.data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from AI");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      const cleanRaw = raw.replace(/```(json)?/gi, '').trim();
      parsed = JSON.parse(cleanRaw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      let extracted = match ? match[0] : raw;
      try {
        parsed = JSON.parse(extracted);
      } catch {
        // Try repairing truncated JSON
        const repairSuffixes = [
          '"]}', '"}', ']', '}', '"}], "assets": []}', '"}]}', '"]}'
        ];
        let repaired = false;
        for (const suffix of repairSuffixes) {
          try {
            parsed = JSON.parse(extracted + suffix);
            repaired = true;
            break;
          } catch (e) { }
        }
        if (!repaired) {
          // One last attempt: maybe a literal newline in string
          try {
            const fixedNewlines = extracted.replace(/(?<!\\)\n/g, "\\n").replace(/(?<!\\)\r/g, "");
            parsed = JSON.parse(fixedNewlines);
          } catch {
            throw new Error("AI returned invalid JSON");
          }
        }
      }
    }
  }

  const files = Array.isArray(parsed)
    ? parsed
    : parsed.files || parsed.data || [];

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("AI did not generate any files");
  }

  return files;
}

async function createGitHubRepo(name, description, token) {
  try {
    const safeDesc = (description || "AI Generated Website")
      .replace(/[\r\n]+/g, " ")
      .substring(0, 250);
    const response = await axios.post(
      "https://api.github.com/user/repos",
      {
        name,
        description: safeDesc,
        private: false,
        auto_init: false,
      },
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
    return response.data;
  } catch (err) {
    if (err.response?.status === 422) {
      const ghError = err.response.data;
      const errorMsg = ghError.errors
        ? ghError.errors.map((e) => e.message || e.code).join(", ")
        : ghError.message;
      throw new Error(
        `GitHub Validation Error (422): ${errorMsg}. Repo Name: "${name}"`,
      );
    }
    throw err;
  }
}

async function pushFilesToGitHub(files, repoData, tempDir, token) {
  // Create temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // Write generated files to disk
  for (const file of files) {
    const filePath = path.join(tempDir, file.filename);
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.content, "utf-8");
  }

  // Initialize git and push
  const cloneUrl = repoData.clone_url.replace(
    "https://",
    `https://x-access-token:${token}@`,
  );

  const commands = [
    `git init`,
    `git config user.email "quicklive@generated.ai"`,
    `git config user.name "QuickLive AI"`,
    `git add -A`,
    `git commit -m "✨ Initial commit — AI generated website"`,
    `git branch -M main`,
    `git remote add origin ${cloneUrl}`,
    `git push -u origin main`,
  ];

  for (const cmd of commands) {
    await execAsync(cmd, { cwd: tempDir });
  }
}

/**
 * POST /api/generate/chat
 * Body: { messages: [{role, content}] }
 */
export async function handleChat(req, res, next) {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return next({ status: 400, message: "Valid messages array required" });
  }

  const mistralApiKey = config.MISTRAL_API_KEY;
  if (!mistralApiKey) {
    return next({ status: 500, message: "AI is not configured" });
  }

  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: `You are the Quicklive System AI, the built-in assistant for the Quicklive deployment platform. The user is currently on the Quicklive website. 
Your role is to help them navigate the platform, deploy projects, and fix build errors.
How deployment works on Quicklive:
1. Users link their GitHub account.
2. They select a repository from their dashboard to deploy. Quicklive pulls the code, builds it automatically in a Docker container, and gives them a live URL.
3. Users can also use the 'Generate Website' tool to create custom sites via AI, which Quicklive pushes to their GitHub and automatically deploys.
Always answer assuming the user is trying to use the Quicklive platform. Do NOT ask them what platform they are using—they are using Quicklive. Keep responses concise, direct, slightly cyberpunk/technical in tone, and highly helpful.`,
          },
          ...messages.slice(-6) // Keep last 6 messages for context
        ],
        temperature: 0.7,
        max_tokens: 512,
      },
      {
        headers: {
          Authorization: `Bearer ${mistralApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const aiMessage =
      response.data.choices[0]?.message?.content ||
      "I am currently unable to process your request.";
    res.status(200).json({ success: true, message: aiMessage });
  } catch (error) {
    console.error("AI Chat Error:", error?.response?.data || error.message);
    return next({
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "AI service error. Please try again later.",
    });
  }
}

/**
 * POST /api/generate/chat/stream
 * Body: { messages: [{role, content}] }
 * Streams AI response token-by-token via SSE
 */
export async function handleChatStream(req, res) {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: "Valid messages array required" });
  }

  const mistralApiKey = config.MISTRAL_API_KEY;
  if (!mistralApiKey) {
    return res.status(500).json({ success: false, message: "AI is not configured" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: `You are the Quicklive System AI, the built-in assistant for the Quicklive deployment platform. The user is currently on the Quicklive website. 
Your role is to help them navigate the platform, deploy projects, and fix build errors.
How deployment works on Quicklive:
1. Users link their GitHub account.
2. They select a repository from their dashboard to deploy. Quicklive pulls the code, builds it automatically in a Docker container, and gives them a live URL.
3. Users can also use the 'Generate Website' tool to create custom sites via AI, which Quicklive pushes to their GitHub and automatically deploys.
Always answer assuming the user is trying to use the Quicklive platform. Keep responses concise, direct, slightly cyberpunk/technical in tone, and highly helpful.`
          },
          ...messages.slice(-6)
        ],
        temperature: 0.7,
        max_tokens: 512,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${mistralApiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n").filter((l) => l.trim());
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") {
          res.write("data: [DONE]\n\n");
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch (_) { }
      }
    });

    response.data.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();
    });

    response.data.on("error", (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    req.on("close", () => response.data.destroy());
  } catch (error) {
    console.error("AI Stream Error:", error?.response?.data || error.message);
    res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
    res.end();
  }
}
