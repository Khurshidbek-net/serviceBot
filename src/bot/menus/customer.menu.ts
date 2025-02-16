import { Markup } from "telegraf";

export const customerMenu = Markup.keyboard([
  ["📋 XIZMATLAR"],
  ["✅ TANLANGAN XIZMATLAR"],
  ["⚙️ MA’LUMOTLARNI O’ZGARTIRISH"]
])
  .resize()
  .oneTime();
