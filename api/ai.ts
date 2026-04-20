import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GOOGLE_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

export async function chatWithAI(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  console.log("🤖 Iniciando respuesta de AI...");

  if (!genAI) {
    console.log("⚠️ GOOGLE_API_KEY no configurada");
    return "Claudia está configurando su cerebro. Intenta de nuevo en un momento.";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const historyText = conversationHistory
    .slice(-10)
    .map((msg) => `${msg.role === "user" ? "Usuario" : "Claudia"}: ${msg.content}`)
    .join("\n");

  const prompt = `${systemPrompt}\n\nHistoria:\n${historyText}\n\nUsuario: ${userMessage}\nClaudia:`;

  try {
    console.log("📤 Enviando a Gemini...");
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log("✅ Respuesta de AI recibida");
    return response || "Claudia te necesita un momento más.";
  } catch (error: any) {
    console.error("❌ Error Google AI:", error.message || error);
    return "Claudia tuvo un problema técnico. Intenta de nuevo.";
  }
}