import { Bot } from "grammy";
import { initFirebase, getTareas, getClientes } from "./firebase.js";
import { chatWithAI } from "./ai.js";
import { SYSTEM_PROMPT } from "./config.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
console.log("📦 TOKEN:", !!BOT_TOKEN);
console.log("📦 GOOGLE:", !!process.env.GOOGLE_API_KEY);

const bot = new Bot(BOT_TOKEN || "dummy");
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
  await ctx.reply(
    `¡Hola! 👋\n\nSoy Claudia de Tiempo Propiedades.\n\n🏡 Parcelas y casas en Villarrica\n\nUsa el menú:`,
    { reply_markup: menu }
  );
});

bot.command("propiedades", async (ctx) => {
  await ctx.reply(
    "🏡 *Tiempo Propiedades*\n• Chesque: $44M\n• Cudico: $58M\n• 5ta Faja: $48M\n• Conquil: $65M\n• Volcánes: $89M\n📈 Plusvalía: 4%",
    { parse_mode: "Markdown" }
  );
});

bot.command("contacto", async (ctx) => {
  await ctx.reply("📞 +56 9 7421 9730");
});

bot.on("message:text", async (ctx) => {
  const uid = ctx.from?.id;
  const txt = ctx.message?.text || "";
  if (!uid || txt.startsWith("/")) return;

  if (txt === "📋 Tareas" || txt === "👥 Clientes" || txt === "💼 Propiedades" || txt === "📞 Contacto" || txt === "💬 Hablar") {
    if (txt === "📋 Tareas") {
      const data = await getTareas();
      await ctx.reply(data.length ? `📋 *Tareas*\n\n${data.map((t: any) => `• ${t.titulo}`).join("\n")}` : "No hay tareas.", { parse_mode: "Markdown" });
    } else if (txt === "👥 Clientes") {
      const data = await getClientes();
      await ctx.reply(data.length ? `👥 *Clientes*\n\n${data.map((c: any) => `• ${c.nombre}`).join("\n")}` : "No hay clientes.", { parse_mode: "Markdown" });
    } else if (txt === "💼 Propiedades") {
      await ctx.reply("🏡 Chesque: $44M | Cudico: $58M | 5ta Faja: $48M | Conquil: $65M | Volcánes: $89M\n📈 Plusvalía: 4%/año");
    } else if (txt === "📞 Contacto") {
      await ctx.reply("📞 Roberto: +56 9 7421 9730\n✉️ promarket08@gmail.com");
    } else if (txt === "💬 Hablar") {
      await ctx.reply("Perfecto, dime ¿qué necesitas saber?");
    }
    return;
  }

  const h = history.get(uid) || [];
  try {
    const resp = await chatWithAI(txt, SYSTEM_PROMPT, h);
    h.push({ role: "user", content: txt });
    h.push({ role: "assistant", content: resp });
    if (h.length > 20) history.set(uid, h.slice(-20));
    await ctx.reply(resp);
  } catch (e: any) {
    console.error("❌ AI:", e.message);
    await ctx.reply("Tuve un problema. Intenta de nuevo.");
  }
});

export default async function handler(req: any, res: any) {
  console.log("📥 req:", req.method, req.url);

  if (req.method !== "POST") {
    return res.status(200).send("Claudia Agente 3.0 🚀");
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) initFirebase();
    const body = req.body || req;
    await bot.handleUpdate(body);
    return res.status(200).send("ok");
  } catch (e: any) {
    console.error("❌ Handler:", e.message);
    return res.status(500).send(`Error: ${e.message}`);
  }
}