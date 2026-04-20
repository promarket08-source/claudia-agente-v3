import { SYSTEM_PROMPT } from "./config.js";

const GOOGLE_API_KEY = "AIzaSyBxVGIQMOOaEipD2rGZOfVGTGyrsvuhysU";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

export async function chatWithAI(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<string> {
  console.log("🤖 AI request...");

  const historyText = conversationHistory
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Usuario" : "Claudia"}: ${m.content}`)
    .join("\n");

  const fullPrompt = `${systemPrompt}

Conversación:
${historyText}

Usuario: ${userMessage}
Claudia:`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: fullPrompt }],
      },
    ],
    systemInstruction: {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  try {
    console.log("📤 Calling Gemini...");
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ Gemini error:", err);
      return "Hola Roberto, estoy actualizando mis datos de las parcelas, ¿en qué te puedo ayudar?";
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("❌ No reply from Gemini");
      return "Hola Roberto, estoy actualizando mis datos de las parcelas, ¿en qué te puedo ayudar?";
    }

    console.log("✅ AI reply received");
    return reply;
  } catch (error: any) {
    console.error("❌ Fetch error:", error.message);
    return "Hola Roberto, estoy actualizando mis datos de las parcelas, ¿en qué te puedo ayudar?";
  }
}