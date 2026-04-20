import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function chatWithAI(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory,
    { role: "user" as const, content: userMessage },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-lite-preview-02-05:free",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 
      "Claudia tuvo un problema al procesar tu mensaje. Intenta de nuevo.";
  } catch (error) {
    console.error("Error OpenRouter:", error);
    return "Claudia tuvo un problema técnico. Intenta de nuevo en un momento.";
  }
}