import { Bot } from "grammy"

const bot = new Bot("8754625349:AAFi4gNbjvm-vPfvkJX2wkwHAEkfglmbEL4")

const menu = { keyboard: [[{ text: "Propiedades" }, { text: "Contacto" }]] }

bot.command("start", async (ctx) => {
  await ctx.reply("Hola! Soy Claudia.", { reply_markup: menu })
})

bot.on("message:text", async (ctx) => {
  const txt = ctx.message?.text || ""
  if (!txt || txt.startsWith("/")) return

  if (txt === "Propiedades") {
    await ctx.reply("Chesque $44M | Cudico $58M")
  } else if (txt === "Contacto") {
    await ctx.reply("Roberto: +56 9 7421 9730")
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