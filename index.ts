import { Bot } from "grammy"

const BOT_TOKEN = "8754625349:AAFi4gNbjvm-vPfvkJX2wkwHAEkfglmbEL4"
const GOOGLE_KEY = "AIzaSyBxVGIQMOOaEipD2rGZOfVGTGyrsvuhysU"

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GOOGLE_KEY

const bot = new Bot(BOT_TOKEN)

const menu = { keyboard: [[{ text: "Propiedades" }, { text: "Contacto" }], [{ text: "Hablar" }]] }

bot.command("start", async (ctx) => {
  await ctx.reply("Hola! Soy Claudia.", { reply_markup: menu })
})

bot.on("message:text", async (ctx) => {
  const txt = ctx.message?.text || ""
  if (!txt || txt.startsWith("/")) return

  if (txt === "Propiedades") {
    await ctx.reply("Chesque $44M | Cudico $58M | 5ta Faja $48M | Conquil $65M")
  } else if (txt === "Contacto") {
    await ctx.reply("Roberto: +56 9 7421 9730")
  } else if (txt === "Hablar") {
    await ctx.reply("Dime")
  } else {
    const prompt = "Claudia: " + txt
    const resp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    })
    const data = await resp.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Hola"
    await ctx.reply(reply)
  }
})

export default async function(req, res) {
  if (req.method !== "POST") return res.send("Claudia alive")
  try {
    await bot.handleUpdate(req.body || {})
    return res.send("ok")
  } catch (e) {
    return res.status(500).send("Error: " + e.message)
  }
}