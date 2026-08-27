import axios from "axios";
import fs from "fs";

const apiKey = "s1UuaO6L3VoTTYXWfNoHlvBM4SF8hy54";
const systemPrompt = `You are an expert web developer. You generate complete, production-ready static websites using HTML, CSS, and vanilla JavaScript only (no frameworks, no npm, no build tools).

CRITICAL RULES:
1. Output ONLY valid JSON — no markdown fences, no explanation text
2. The JSON must be an object with a "files" key containing an array: {"files": [{"filename": "index.html", "content": "..."}, ...]}
3. Always include at minimum: index.html and style.css
4. Use modern CSS (flexbox, grid, CSS variables, smooth animations, glassmorphism)
5. Make the design visually STUNNING — use gradients, transitions, hover effects, and responsive layout
6. The website must be fully responsive (mobile, tablet, desktop)
7. Include proper meta tags, favicon link, and semantic HTML
8. Use Google Fonts for premium typography
9. All CSS must be in a separate style.css file linked from index.html
10. All JS must be in a separate script.js file linked from index.html`;

const userPrompt = `Generate a "custom" style website with the following requirements:

"A dark, cinematic personal portfolio for a creative developer. The site opens with a full-screen hero featuring a large, glitchy, distorted name reveal using SVG text with displacement filters. Background is pure black with subtle animated grain/noise texture. Navigation is minimal — just 4 items in a thin monospace font, right-aligned. Scrolling triggers horizontal marquee text bands with alternating normal and outline typography. Work section uses an asymmetric grid with projects displayed as large numbered cards (01, 02, 03) that tilt on hover with a magnetic cursor effect. Color palette is strictly black, white, and one accent — electric lime (#CAFF00). Typography mix: a heavy serif for display, JetBrains Mono for labels and metadata. Footer is brutalist — full-width, giant text "LET'S TALK" that fills the screen. No gradients, no rounded corners, no stock illustrations. Awwwards-level execution."

Repository name: "test-site"

Return a JSON object with a "files" array. Each file object has "filename" (string) and "content" (string with the full file contents). Include at minimum: index.html, style.css, and script.js.`;

async function test() {
  try {
    const response = await axios.post(
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
      }
    );
    
    const raw = response.data.choices?.[0]?.message?.content;
    fs.writeFileSync("output.json", raw || "No output");
    console.log("Written output to output.json");
    
    let parsed;
    try {
      parsed = JSON.parse(raw);
      console.log("Successfully parsed JSON directly!");
    } catch (e1) {
      console.error("Direct JSON.parse failed:", e1.message);
      try {
        const cleanRaw = raw.replace(/```(json)?/gi, '').trim();
        parsed = JSON.parse(cleanRaw);
        console.log("Successfully parsed JSON after stripping markdown!");
      } catch (e2) {
        console.error("Markdown strip parse failed:", e2.message);
        const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
            console.log("Successfully parsed JSON after regex extraction!");
          } catch (e3) {
            console.error("Regex extraction parse failed:", e3.message);
          }
        }
      }
    }
    
  } catch (err) {
    console.error("API Error:", err.response?.data || err.message);
  }
}

test();
