import { Bot } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8754625349:AAFi4gNbjvm-vPfvkJX2wkwHAEkfglmbEL4";
const GOOGLE_KEY = "AIzaSyBxVGIQMOOaEipD2rGZOfVGTGyrsvuhysU";

const SYSTEM_PROMPT = "Eres Claudia de Tiempo Propiedades. Vendes parcelas en Villarrica. Precios: Chesque $44M, Cudico $58M, 5ta Faja $48M, Conquil $65M, Volcanes $89M. Plusvalia 4%/ano. Contacto: +56 9 7421 9730. Responde en espanol chilena profesional.";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GOOGLE_KEY;

const bot = new Bot(BOT_TOKEN);
const history = new Map();

const menu = { keyboard: [[{ text: "Propiedades" }, { text: "Contacto" }], [{ text: "Hablar" }]] };

bot.use(async (ctx, next) => {
  if (ctx.from?.id && !history.has(ctx.from.id)) history.set(ctx.from.id, []);
  await next();
});

bot.command("start", async (ctx) => {
  await ctx.reply("Hola! Soy Claudia de Tiempo Propiedades. Parcelas en Villarrica. Usa el menu:", { reply_markup: menu });
});

bot.on("message:text", async (ctx) => {
  const uid = ctx.from?.id;
  const txt = ctx.message?.text || "";
  if (!uid || !txt || txt.startsWith("/")) return;

  if (txt === "Propiedades") {
    await ctx.reply("Chesque $44M | Cudico $58M | 5ta Faja $48M | Conquil $65M | Volcanes $89M. Plusvalia 4%/ano");
  } else if (txt === "Contacto") {
    await ctx.reply("Roberto: +56 9 7421 9730");
  } else if (txt === "Hablar") {
    await ctx.reply("Dime que necesitas");
  } else {
    const hist = history.get(uid) || [];
    try {
      const prompt = SYSTEM_PROMPT + "\n\nHistorial: " + hist.map((h: any) => h.role + ": " + h.content).join(" | ") + "\n\nUsuario: " + txt + "\nClaudia:";
      const resp = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
      });
      const data = await resp.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Hola, estoy actualizando. En que te ayudo?";
      hist.push({ role: "user", content: txt });
      hist.push({ role: "assistant", content: reply });
      if (hist.length > 20) history.set(uid, hist.slice(-20));
      await ctx.reply(reply);
    } catch {
      await ctx.reply("Hola Roberto, estoy actualizando. En que te ayudo?");
    }
  }
});

export default async function(req: any, res: any) {
  if (req.method !== "POST") return res.send("Claudia esta viva");
  try {
    await bot.handleUpdate(req.body || {});
    return res.send("ok");
  } catch (e: any) {
    return res.status(500).send("Error: " + e.message);
  }
}