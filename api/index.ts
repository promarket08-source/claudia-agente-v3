import { Bot } from "grammy";
import { initFirebase, getTareas, getClientes } from "./firebase.js";
import { chatWithAI } from "./ai.js";
import { SYSTEM_PROMPT } from "./config.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
console.log("📦 STARTING...");

const bot = new Bot(BOT_TOKEN || "placeholder");
const userHistory = new Map<number, { role: string; content: string }[]>();

const mainMenu = {
  keyboard: [
    [{ text: "📋 Tareas" }, { text: "👥 Clientes" }],
    [{ text: "💼 Propiedades" }, { text: "📞 Contacto" }],
    [{ text: "💬 Hablar" }],
  ],
};

bot.use(async (ctx, next) => {
  if (ctx.from?.id && !userHistory.has(ctx.from.id)) {
    userHistory.set(ctx.from.id, []);
  }
  await next();
});

bot.command("start", async (ctx) => {
  const name = ctx.from?.first_name || "amigo";
  await ctx.reply(`¡Hola ${name}! 👋\n\nSoy Claudia de Tiempo Propiedades.\n\n¿Buscas parcelas en Villarrica? 🏡\n\nUsa el menú:`, { reply_markup: mainMenu });
});

bot.command("propiedades", async (ctx) => {
  await ctx.reply("🏡 *Tiempo Propiedades*\n• Chesque: $44M\n• Cudico: $58M\n• 5ta Faja: $48M\n• Conquil: $65M\n• Volcanes: $89M\n📈 Plusvalía: 4%/año", { parse_mode: "Markdown" });
});

bot.command("contacto", async (ctx) => {
  await ctx.reply("📞 *Roberto*\n\nWhatsApp: +56 9 7421 9730\nEmail: promarket08@gmail.com", { parse_mode: "Markdown" });
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  const text = ctx.message?.text || "";
  if (!userId || !text) return;
  if (text.startsWith("/")) return;

  // Handle menu buttons
  const menuActions: Record<string, () => Promise<void>> = {
    "📋 Tareas": async () => {
      const tareas = await getTareas();
      await ctx.reply(tareas.length ? `📋 Tareas\n\n${tareas.map((t: any) => "• " + t.titulo).join("\n")} : "No hay tareas.");
    },
    "👥 Clientes": async () => {
      const clientes = await getClientes();
      await ctx.reply(clientes.length ? `👥 Clientes\n\n${clientes.map((c: any) => "• " + c.nombre).join("\n")} : "No hay clientes.");
    },
    "💼 Propiedades": async () => {
      await ctx.reply("🏡 Chesque: $44M | Cudico: $58M | 5ta Faja: $48M | Conquil: $65M | Volcanes: $89M\n📈 Plusvalía: 4%");
    },
    "📞 Contacto": async () => {
      await ctx.reply("📞 +56 9 7421 9730");
    },
    "💬 Hablar": async () => {
      await ctx.reply("Perfecto, dime ¿qué necesitas?");
    },
  };

  if (menuActions[text]) {
    await menuActions[text]();
    return;
  }

  // AI Chat
  const history = userHistory.get(userId) || [];
  console.log("💬 msg:", text.substring(0, 50));

  try {
    const reply = await chatWithAI(text, SYSTEM_PROMPT, history);
    history.push({ role: "user", content: text });
    history.push({ role: "assistant", content: reply });
    if (history.length > 20) history.splice(0, history.length - 20);
    userHistory.set(userId, history);
    await ctx.reply(reply);
  } catch (e: any) {
    console.error("❌ AI:", e.message);
    await ctx.reply("Tuve un problema. Intenta de nuevo.");
  }
});

// Vercel handler
export default async function(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.send("Claudia 3.0 Ready 🚀");
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      initFirebase();
    }

    // Handle Telegram update
    const update = req.body || {};
    console.log("📨 update:", JSON.stringify(update).substring(0, 200));

    await bot.handleUpdate(update);
    return res.status(200).send("ok");
  } catch (e: any) {
    console.error("❌:", e.message);
    return res.status(500).send("Error: " + e.message);
  }
}