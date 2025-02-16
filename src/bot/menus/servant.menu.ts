import { Markup } from "telegraf";

export const servantMenu = Markup.keyboard([
  ["👥 MIJOZLAR", "⏳ VAQT", "⭐ REYTING"],
  ["⚙️ MA’LUMOTLARNI YANGILASH"]
])
  .resize()
  .oneTime();
