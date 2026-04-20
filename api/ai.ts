import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function chatWithAI(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const historyText = conversationHistory
    .map((msg) => `${msg.role === "user" ? "Usuario" : "Claudia"}: ${msg.content}`)
    .join("\n");

  const prompt = `${systemPrompt}\n\nConversación anterior:\n${historyText}\n\nUsuario: ${userMessage}\nClaudia:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response || "Claudia tuvo un problema al procesar tu mensaje. Intenta de nuevo.";
  } catch (error) {
    console.error("Error Google AI:", error);
    return "Claudia tuvo un problema técnico. Intenta de nuevo en un momento.";
  }
}