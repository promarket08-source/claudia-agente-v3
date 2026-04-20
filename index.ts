import { Bot } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8754625349:AAFi4gNbjvm-vPfvkJX2wkwHAEkfglmbEL4";
const GOOGLE_KEY = "AIzaSyBxVGIQMOOaEipD2rGZOfVGTGyrsvuhysU";

const SYSTEM_PROMPT = `Eres Claudia, la Agente Senior de Tiempo Propiedades. Ayudas a Roberto a vender parcelas en Villarrica.

Parcelas:
- Chesque: $44.000.000
- Cudico: $58.000.000
- 5ta Faja: $48.000.000
- Conquil: $65.000.000
- Volcanes: $89.000.000
Plusvalía: 4%/año

Contacto: +56 9 7421 9730

Responde en español chileno, profesional, enfocado en cerrar la venta.`;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_KEY}`;

const bot = new Bot(BOT_TOKEN);
const history = new Map<number, { role: string; content: string }[]>();

const menu = {
  keyboard: [
    [{ text: "📋 Tareas" }, { text: "👥 Clientes" }],
    [{ text: "💼 Propiedades" }, { text: "📞 Contacto" }],
    [{ text: "💬 Hablar" }],
  ],
};

bot.use(async (ctx, next) => {
  if (ctx.from?.id && !history.has(ctx.from.id)) history.set(ctx.from.id, []);
  await next();
});

bot.command("start", async (ctx) => {
  await ctx.reply(`¡Hola! 👋\n\nSoy Claudia de Tiempo Propiedades.\n🏡 Parcelas en Villarrica\n\nUsa el menú:`, { reply_markup: menu });
});

bot.on("message:text", async (ctx) => {
  const uid = ctx.from?.id;
  const txt = ctx.message?.text || "";
  if (!uid || !txt || txt.startsWith("/")) return;

  if (txt === "💼 Propiedades") {
    await ctx.reply("🏡 Chesque: $44M | Cudico: $58M | 5ta Faja: $48M | Conquil: $65M | Volcanes: $89M\n📈 Plusvalía: 4%/año");
  } else if (txt === "📞 Contacto") {
    await ctx.reply("📞 Roberto: +56 9 7421 9730\n✉️ promarket08@gmail.com");
  } else if (txt === "💬 Hablar") {
    await ctx.reply("Perfecto, dime ¿qué necesitas saber?");
  } else if (txt === "📋 Tareas" || txt === "👥 Clientes") {
    await ctx.reply("No hay datos aún. Roberto, ¿los creo en Firebase?");
  } else {
    const hist = history.get(uid) || [];
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nHistorial:\n${hist.map(h => `${h.role}: ${h.content}`).join("\n")}\n\nUsuario: ${txt}\nClaudia:`;
      
      const resp = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
        })
      });
      
      const data = await resp.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Hola, estoy actualizando mis datos. ¿En qué te ayudo?";
      
      hist.push({ role: "user", content: txt });
      hist.push({ role: "assistant", content: reply });
      if (hist.length > 20) history.set(uid, hist.slice(-20));
      
      await ctx.reply(reply);
    } catch (e) {
      await ctx.reply("Hola Roberto, estoy actualizando mis datos. ¿En qué te puedo ayudar?");
    }
  }
});

export default async function(req: any, res: any) {
  if (req.method !== "POST") return res.send("Claudia está viva 🚀");
  
  try {
    await bot.handleUpdate(req.body || {});
    return res.send("ok");
  } catch (e: any) {
    return res.status(500).send("Error: " + e.message);
  }
}