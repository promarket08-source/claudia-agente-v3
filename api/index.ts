import { Bot, webhookCallback } from "grammy";
import { initFirebase, getTareas, getClientes } from "./firebase.js";
import { chatWithAI } from "./ai.js";
import { SYSTEM_PROMPT } from "./config.js";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");

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
    `¡Hola ${nombre}! 👋\n\nSoy Claudia, la Agente Senior de Tiempo Propiedades.\n\n¿Buscas parcelas o casas en Villarrica? ¡Tengo las mejores oportunidades de inversión! 🏡\n\nUsa el menú:`,
    { reply_markup: menuKeyboard }
  );
});

bot.command("propiedades", async (ctx) => {
  const props = `🏡 *Tiempo Propiedades - Villarrica*\n\n` +
    `• Parcela Chesque: $44.000.000\n` +
    `• Parcela Cudico: $58.000.000\n` +
    `• Parcela 5ta Faja: $48.000.000\n` +
    `• Parcela Conquil: $65.000.000\n` +
    `• Casa Los Volcanes: $89.000.000\n\n` +
    `📈 *Plusvalía estimada: 4% anual*\n` +
    `💬 ¿Cuál te interesa más?`;
  await ctx.reply(props, { parse_mode: "Markdown", reply_markup: menuKeyboard });
});

bot.command("contacto", async (ctx) => {
  await ctx.reply(
    `📞 *Contacto Roberto*\n\n` +
    `• WhatsApp: +56 9 7421 9730\n` +
    `• Email: promarket08@gmail.com\n` +
    `• Instagram: @tu.web.pro360\n\n` +
    `¡Escríbele ahora! 🟢`,
    { parse_mode: "Markdown" }
  );
});

bot.command("tareas", async (ctx) => {
  try {
    const tareas = await getTareas();
    if (tareas.length === 0) {
      await ctx.reply("Roberto, no hay tareas en el dashboard. ¿Quieres que cree una?");
      return;
    }
    const lista = tareas.map((t) => `• ${t.titulo} [${t.estado || "pendiente"}]`).join("\n");
    await ctx.reply(`📋 *Tareas*\n\n${lista}`, { parse_mode: "Markdown" });
  } catch {
    await ctx.reply("Error al cargar tareas. Verifica Firebase.");
  }
});

bot.command("clientes", async (ctx) => {
  try {
    const clientes = await getClientes();
    if (clientes.length === 0) {
      await ctx.reply("Roberto, no hay clientes en el dashboard.");
      return;
    }
    const lista = clientes
      .map((c) => `• ${c.nombre} - ${c.telefono} (${c.interes || "sin interés"})`)
      .join("\n");
    await ctx.reply(`👥 *Clientes*\n\n${lista}`, { parse_mode: "Markdown" });
  } catch {
    await ctx.reply("Error al cargar clientes. Verifica Firebase.");
  }
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  const text = ctx.message?.text || "";

  if (!userId || text.startsWith("/")) return;

  const buttons: Record<string, () => Promise<void>> = {
    "📋 Ver Tareas": async () => {
      try {
        const tareas = await getTareas();
        const msg = tareas.length
          ? `📋 *Tareas*\n\n${tareas.map((t) => `• ${t.titulo} [${t.estado || "pendiente"}]`).join("\n")}`
          : "No hay tareas en el dashboard.";
        await ctx.reply(msg, { parse_mode: "Markdown" });
      } catch {
        await ctx.reply("Error al cargar tareas.");
      }
    },
    "👥 Ver Clientes": async () => {
      try {
        const clientes = await getClientes();
        const msg = clientes.length
          ? `👥 *Clientes*\n\n${clientes.map((c) => `• ${c.nombre} - ${c.telefono}`).join("\n")}`
          : "No hay clientes.";
        await ctx.reply(msg, { parse_mode: "Markdown" });
      } catch {
        await ctx.reply("Error al cargar clientes.");
      }
    },
    "💼 Propiedades": async () => {
      const props = `🏡 *Tiempo Propiedades*\n\n• Parcela Chesque: $44.000.000\n• Parcela Cudico: $58.000.000\n• Parcela 5ta Faja: $48.000.000\n• Parcela Conquil: $65.000.000\n• Casa Los Volcanes: $89.000.000\n\n📈 Plusvalía: 4% anual`;
      await ctx.reply(props, { parse_mode: "Markdown" });
    },
    "📞 Contacto": async () => {
      await ctx.reply("📞 *Roberto*\n\nWhatsApp: +56 9 7421 9730\nEmail: promarket08@gmail.com", { parse_mode: "Markdown" });
    },
    "💬 Hablar con Claudia": async () => {
      await ctx.reply("Perfecto, hablemos. ¿Sobre qué quieres conocer?");
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
    if (history.length > 20) {
      conversationHistory.set(userId, history.slice(-20));
    }
    await ctx.reply(response);
  } catch (error) {
    console.error("Error:", error);
    await ctx.reply("Tuve un problema. Intenta de nuevo.");
  }
});

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  initFirebase();
}

export default webhookCallback(bot, "std/http");