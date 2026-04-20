import { Bot, webhookCallback } from "grammy";
import { initFirebase, getTareas, getClientes } from "./firebase.js";
import { chatWithAI } from "./ai.js";
import { SYSTEM_PROMPT } from "./config.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

console.log("🔍 TOKEN:", !!BOT_TOKEN);
console.log("🔍 GOOGLE:", !!GOOGLE_KEY);

let bot: Bot;

if (BOT_TOKEN) {
  bot = new Bot(BOT_TOKEN);
} else {
  console.warn("⚠️ SIN TOKEN - Bot no configurado");
  bot = new Bot("dummy");
}

const conversationHistory = new Map<number, { role: "user" | "assistant"; content: string }[]>();

const menuKeyboard = {
  keyboard: [
    [{ text: "📋 Ver Tareas" }, { text: "👥 Ver Clientes" }],
    [{ text: "💼 Propiedades" }, { text: "📞 Contacto" }],
    [{ text: "💬 Hablar con Claudia" }],
  ],
};

bot.use(async (ctx, next) => {
  if (ctx.from && !conversationHistory.has(ctx.from.id)) {
    conversationHistory.set(ctx.from.id, []);
  }
  await next();
});

bot.command("start", async (ctx) => {
  const nombre = ctx.from?.first_name || "amigo";
  await ctx.reply(
    `¡Hola ${nombre}! 👋\n\nSoy Claudia, la Agente Senior de Tiempo Propiedades.\n\n¿Buscas parcelas o casas en Villarrica? 🏡\n\nUsa el menú:`,
    { reply_markup: menuKeyboard }
  );
});

bot.command("propiedades", async (ctx) => {
  await ctx.reply(
    `🏡 *Tiempo Propiedades*\n\n• Chesque: $44M\n• Cudico: $58M\n• 5ta Faja: $48M\n• Conquil: $65M\n• Los Volcanes: $89M\n\n📈 Plusvalía: 4%`,
    { parse_mode: "Markdown" }
  );
});

bot.command("contacto", async (ctx) => {
  await ctx.reply("📞 +56 9 7421 9730", { parse_mode: "Markdown" });
});

bot.command("tareas", async (ctx) => {
  const tareas = await getTareas();
  const msg = tareas.length
    ? `📋 *Tareas*\n\n${tareas.map((t: any) => `• ${t.titulo}`).join("\n")}`
    : "No hay tareas.";
  await ctx.reply(msg, { parse_mode: "Markdown" });
});

bot.command("clientes", async (ctx) => {
  const clientes = await getClientes();
  const msg = clientes.length
    ? `👥 *Clientes*\n\n${clientes.map((c: any) => `• ${c.nombre}`).join("\n")}`
    : "No hay clientes.";
  await ctx.reply(msg, { parse_mode: "Markdown" });
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  const text = ctx.message?.text || "";

  if (!userId || text.startsWith("/")) return;

  const buttons: Record<string, () => Promise<void>> = {
    "📋 Ver Tareas": async () => {
      const tareas = await getTareas();
      await ctx.reply(
        tareas.length
          ? `📋 *Tareas*\n\n${tareas.map((t: any) => `• ${t.titulo}`).join("\n")}`
          : "No hay tareas.",
        { parse_mode: "Markdown" }
      );
    },
    "👥 Ver Clientes": async () => {
      const clientes = await getClientes();
      await ctx.reply(
        clientes.length
          ? `👥 *Clientes*\n\n${clientes.map((c: any) => `• ${c.nombre}`).join("\n")}`
          : "No hay clientes.",
        { parse_mode: "Markdown" }
      );
    },
    "💼 Propiedades": async () => {
      await ctx.reply(
        "🏡 *Tiempo Propiedades*\n\n• Chesque: $44M\n• Cudico: $58M\n• 5ta Faja: $48M\n• Conquil: $65M\n• Los Volcanes: $89M\n\n📈 Plusvalía: 4%",
        { parse_mode: "Markdown" }
      );
    },
    "📞 Contacto": async () => {
      await ctx.reply("📞 +56 9 7421 9730", { parse_mode: "Markdown" });
    },
    "💬 Hablar con Claudia": async () => {
      await ctx.reply("Perfecto, dime ¿qué quieres saber?");
    },
  };

  if (buttons[text]) {
    await buttons[text]();
    return;
  }

  const history = conversationHistory.get(userId) || [];

  try {
    const response = await chatWithAI(text, SYSTEM_PROMPT, history);
    history.push({ role: "user", content: text });
    history.push({ role: "assistant", content: response });
    if (history.length > 20) conversationHistory.set(userId, history.slice(-20));
    await ctx.reply(response);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await ctx.reply("Tuve un problema. Intenta de nuevo.");
  }
});

export default async (req: any, res: any) => {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("Claudia Agente 3.0 🚀");
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT) initFirebase();

    const handler = webhookCallback(bot, "vercel");
    return await handler(req, res);
  } catch (e: any) {
    console.error("❌ Error:", e.message);
    return res.status(500).send(`Error: ${e.message}`);
  }
};