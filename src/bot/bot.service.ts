import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Servant } from './models/servant.model';
import { Context, Markup, Telegraf } from 'telegraf';
import { BOT_NAME } from '../app.consts';
import { InjectBot } from 'nestjs-telegraf';
import { Customer } from './models/customer.model';
import { servantMenu } from './menus/servant.menu';
import { customerMenu } from './menus/customer.menu';
import { callback } from 'telegraf/typings/button';
import { CustomerServiceQueue } from './models/customerServiceQueue.model';
import { text } from 'stream/consumers';
import { averageTimeOptions, durationOptions, endTimeKeyboard, getTimeTable, startTimeKeyboard, timeSlots, weekTable } from './keyboards/inlineKeyboard';
import { ServantTimeTable } from './models/servantTimeTable.model';
import { TimeSelection } from './helpers/TimeSelection';
import { getServantBookedTimes } from './helpers/bookedTime';
import { Op } from 'sequelize';
import { repl } from '@nestjs/core';

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Servant) private readonly servantModel: typeof Servant,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(CustomerServiceQueue) private readonly customerServiceQueueModel: typeof CustomerServiceQueue,
    @InjectModel(ServantTimeTable) private readonly servantTimeTableModel: typeof ServantTimeTable,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>

  ) { }

  protected service = '';

  async start(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      if (!user_id) {
        throw new Error("User ID not found");
      }

      const servant = await this.servantModel.findByPk(user_id);
      const customer = await this.customerModel.findByPk(user_id);

      if (servant && servant.last_state == 'finish') {
        await ctx.reply("📝 Usta menusi", servantMenu)
      }

      else if (customer && customer.last_state == 'finish') {
        await ctx.reply("📝 Mijoz menusi", customerMenu)
      }
      else {
        await ctx.reply("Botdan foydalanish uchun avval ro'yxatdan o'ting", {
          parse_mode: 'HTML',
          ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
        });
      }
    } catch (error) {
      console.error("start() handler error:", error);
      await ctx.reply("Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring");
    }
  }

  async onContact(ctx: Context) {
    if ('contact' in ctx.message!) {

      const user_id = ctx.from?.id;
      const servant = await this.servantModel.findByPk(user_id);
      const customer = await this.customerModel.findByPk(user_id);

      if (!servant && !customer) {
        return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
        });
      }

      if (ctx.message!.contact.user_id !== user_id) {
        await ctx.reply(`<b>❌ Iltimos, shaxsiy telefon raqamingizni yuboring!</b> `, {
          parse_mode: "HTML",
          ...Markup.keyboard([[Markup.button.contactRequest("📞 Telefon raqamingizni yuborish")]]).resize().oneTime()
        });
      }

      if (servant) {
        if (servant.last_state == 'phone') {
          servant.last_state = 'office';
          servant.phone_number = ctx.message.contact.phone_number;
          await servant.save();
          await ctx.reply('🏢 Iltimos ustaxona nomini kiriting')
        }
      }


      if (customer) {
        if (customer.last_state == 'phone') {
          customer.last_state = 'finish'
          customer.phone_number = ctx.message.contact.phone_number;
          await customer.save();
          await ctx.reply("✅ Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz!");
          await ctx.reply("📝 Mijoz menusi", customerMenu)
        }
        if (customer.last_state === 'change_phone') {
          customer.phone_number = ctx.message.contact.phone_number;
          customer.last_state = 'finish';
          await customer.save();
          return await ctx.reply("✅ Telefon raqam muvaffaqiyatli yangilandi!", customerMenu);
        }
      }
    }
  }

  async onLocation(ctx: Context) {
    try {
      if ("location" in ctx.message!) {
        const user_id = ctx.from?.id;
        const servant = await this.servantModel.findByPk(user_id);
        if (!servant) {
          return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
          });
        } else {
          if (servant) {
            servant.location = `${ctx.message.location.latitude},${ctx.message.location.longitude}`
            servant.last_state = "start_time"
            await servant.save();
            return await ctx.reply("⏰ Ish boshlash vaqtini tanlang", {
              reply_markup:
                { inline_keyboard: startTimeKeyboard }
            });
          }
        }
      }
    } catch (error) {
      console.log("OnLocation Error ", error)
    }
  }

  async register(ctx: Context) {
    try {
      await ctx.reply("Ro'yxatdan o'tish uchun quyidagilardan birini tanlang", {
        parse_mode: 'HTML',
        ...Markup.keyboard([["👥 Mijoz", "🛠 Usta"]])
          .oneTime().resize()
      })
    } catch (error) {
      console.log("Error on register: ", error)
    }
  }


  // =============== CUSTOMER

  async registerCustomer(ctx: Context) {
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);

    if (!customer) {
      await this.customerModel.create({
        user_id,
        username: ctx.from?.username,
        last_state: 'name'
      })
      await ctx.reply("📛 Iltimos, ismingizni kiriting:");
    }
    else {
      await ctx.reply("📝 Mijoz menusi", customerMenu)
    }
  }

  async customer(ctx: Context) {
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);
    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }
    try {
      const inlineKeyboard = [
        [{ text: '💇‍♂️ Sartaroshxona', callback_data: "service_1" }],
        [{ text: '💅 Go‘zallik saloni', callback_data: "service_2" }],
        [{ text: '💎 Zargarlik ustaxonasi', callback_data: "service_3" }],
        [{ text: '👞 Poyabzal ustaxonasi', callback_data: "service_4" }],
        [{ text: '⌚ Soatsoz', callback_data: "service_5" }]
      ];

      await ctx.reply("Siz qaysi xizmatdan foydalanmoqchisiz", {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        }
      })
    } catch (error) {
      console.log("Error on customer: ", error);
    }
  }

  async customerChangeInfo(ctx: Context) {
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);
    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const inlineKeyboard = [
      [{ text: '✏️ Ism', callback_data: 'change_name' }, { text: '☎️ Telefon', callback_data: 'change_phone' }]
    ]
    await ctx.reply("O'zgartirmoqchi bo'lgan maydonni tanlang", {
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    })
  }

  async onClickChange(ctx: Context) {

    const user_id = ctx.from?.id;
    if (!user_id) return;

    const customer = await this.customerModel.findByPk(user_id);
    if (!customer) return;

    const contextAction = ctx.callbackQuery!["data"]

    if (contextAction === 'change_name') {
      customer.last_state = 'change_name';
      await customer.save();
      return await ctx.editMessageText("✍️ Yangi ismingizni kiriting:");
    }

    if (contextAction === 'change_phone') {
      customer.last_state = 'change_phone';
      await customer.save();
      await ctx.deleteMessage();
      return await ctx.reply("📞 Telefon raqamingizni yuboring:", {
        parse_mode: "HTML",
        ...Markup.keyboard([[Markup.button.contactRequest("📞 Telefon raqamingizni yuborish")]]).resize().oneTime()
      });
    }
  }

  async OnClickServiceByCustomer(ctx: Context) {
    const contextAction = ctx.callbackQuery!["data"]
    const services = {
      service_1: "💇‍♂️ Sartaroshxona",
      service_2: "💅 Go‘zallik saloni",
      service_3: "💎 Zargarlik ustaxonasi",
      service_4: "👞 Poyabzal ustaxonasi",
      service_5: "⌚ Soatsoz"
    };


    this.service = services[contextAction];


    const inlineKeyboard = [
      [{ text: '👤 Ism', callback_data: 'ism' }],
      [{ text: '⭐ Reyting', callback_data: 'rating' }],
      [{ text: '🚩 Manzil', callback_data: 'location' }],
    ]
    await ctx.reply('🗳️ Quyidagilardan birini tanlang', {
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    })
    await ctx.answerCbQuery();

  }

  async onClickName(ctx){
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);
    
    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const servants = await this.servantModel.findAll({
      where: { job: this.service },
      attributes: ["user_id", "first_name", "phone_number"], 
    });

    if(servants.length == 0){
      await ctx.answerCbQuery();
      return await ctx.editMessageText(`🚫 Hozircha nomzodlar mavjud emas.`)
    }
    const inlineKeyboard = servants.map(servant => [
      {
        text: `${servant.first_name} ${servant.phone_number}`,
        callback_data: `servant-${servant.user_id}`
      }
    ]);
    await ctx.answerCbQuery();
    return await ctx.editMessageText(`${this.service} xizmati`, {
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    })
    
  }

  async onClickRating(ctx){
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);

    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const servents = await this.servantModel.findAll({
      attributes: ["user_id", "first_name", "rating"],
      order: [["rating", "DESC"]], 
      limit: 10 
    });

    if (servents.length === 0) {
      await ctx.answerCbQuery();
      return await ctx.reply("🚫 Hozircha nomzodlar mavjud emas.");
    }

    const getStars = (rating) => "⭐".repeat(rating) || "⭐";
    const inlineKeyboard = servents.map(servant => [
      {
        text: `${servant.first_name}  ${getStars(servant.rating)}`,
        callback_data: `servant-${servant.user_id}`
      }
    ]);

    inlineKeyboard.push([
      { text: "◀ ORTGA", callback_data: "customer_back" },
      { text: "NAVBATDAGI ▶", callback_data: "next_customer" }
    ]);

    await ctx.editMessageText("🏆 Eng yaxshi nomzodlar:", {
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
    await ctx.answerCbQuery();
  }

  async onClickServant(ctx){
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);
    const callbackData = ctx.callbackQuery.data;
    

    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const servant_id = callbackData.split("-")[1];
    const servant = await this.servantModel.findByPk(servant_id);

    if (!servant) {
      await ctx.answerCbQuery();
      return await ctx.reply("🚫 Usta topilmadi.");
    }

    const servantInfo = `👨‍🔧 <b>USTA MA’LUMOTLARI:</b>\n\n` +
      `<b>ISMI:</b> ${servant.first_name}\n` +
      `<b>TELEFON RAQAMI:</b> ${servant.phone_number}\n` +
      `<b>USTAXONA NOMI:</b> ${servant.workshop_name}\n` +
      `<b>MANZILI:</b> ${servant.address}\n` +
      `<b>MO'LJAL:</b> ${servant.landmark}`;

    const inlineKeyboard = [
      [{ text: "📍 LOKATSIYASI", callback_data: `manzil-${servant_id}` },
      { text: "📅 VAQT OLISH", callback_data: `book-${servant_id}` }],
      [{ text: "⭐ BAHOLASH", callback_data: `rate-${servant_id}` },
      { text: "◀ ORTGA", callback_data: "customer_back" }]
    ];

    await ctx.editMessageText(servantInfo, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
    await ctx.answerCbQuery()


  }

  async onClickServantLocation(ctx){
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);
    const callbackData = ctx.callbackQuery.data;

    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const servant_id = callbackData.split("-")[1];
    const servant = await this.servantModel.findByPk(servant_id);
    const location = servant?.location;


    if (!servant) {
      await ctx.answerCbQuery();
      return await ctx.reply("🚫 Usta topilmadi.");
    }

    await ctx.replyWithLocation(
      Number(location?.split(",")[0]),
      Number(location?.split(",")[1])
    )
    await ctx.answerCbQuery();
  }

  async onCustomerBack(ctx) {
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);
    const callbackData = ctx.callbackQuery.data;

    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const inlineKeyboard = [
      [{ text: '👤 Ism', callback_data: 'ism' }],
      [{ text: '⭐ Reyting', callback_data: 'rating' }],
      [{ text: '🚩 Manzil', callback_data: 'location' }],
    ]
    await ctx.editMessageText('🗳️ Quyidagilardan birini tanlang', {
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    })
    await ctx.answerCbQuery();

  }

  async onChooseServentTime(ctx){
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);
    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }
    await ctx.reply("Ish kunlari", weekTable)
  }


  async customerChosenServices(ctx: Context) {
    const user_id = ctx.from?.id;
    const customer = await this.customerModel.findByPk(user_id);
    if (!customer) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const queue = await this.customerServiceQueueModel.findAll({
      where: { customer_id: user_id, status: "pending" },
      order: [["date_time", "ASC"]],
    });

    if (!queue.length) {
      return await ctx.reply("🙅‍♂️ Siz hali hech qanday xizmatga navbat olmadingiz.");
    }

    let message = "<b>Siz tanlagan xizmatlar:</b>\n";
    queue.forEach((q) => {
      message += `📅 ${q.date_time.toLocaleDateString()} – ${q.date_time.toLocaleTimeString()} / 🛠 ${q.service_name}, ${ctx.from?.first_name}\n`;
    });

    await ctx.reply(message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📍 Manzilni ko‘rish", callback_data: "view_location" }],
          [{ text: "❌ Bekor qilish", callback_data: "cancel_service" }],
          [{ text: "✉️ Xabar yuborish", callback_data: "send_message" }],
        ],
      },
    });
  }

  async cancelService(ctx: Context) {
    const user_id = ctx.from?.id;
    const queue = await this.customerServiceQueueModel.findOne({
      where: { customer_id: user_id, status: "pending" },
    });

    if (!queue) {
      return await ctx.reply("Bekor qilish uchun xizmat topilmadi.");
    }

    queue.status = "cancelled";
    await queue.save();

    await ctx.reply("✅ Xizmat bekor qilindi.");
  }

  async sendMessage(ctx: Context) {
    await ctx.reply("✍️ Ustaga jo‘natmoqchi bo‘lgan xabaringizni yozing:");
  }

  





  // ==================  SERVANT

  async servant(ctx: Context) {
    try {
      const inlineKeyboard = [
        [{ text: '💇‍♂️ Sartaroshxona', callback_data: "button_1" }],
        [{ text: '💅 Go‘zallik saloni', callback_data: "button_2" }],
        [{ text: '💎 Zargarlik ustaxonasi', callback_data: "button_3" }],
        [{ text: '👞 Poyabzal ustaxonasi', callback_data: "button_4" }],
        [{ text: '⌚ Soatsoz', callback_data: "button_5" }]
      ];

      await ctx.reply("Siz qaysi xizmatni taklif qilmoqchisiz", {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        }
      })
    } catch (error) {
      console.log("Error on servant: ", error);
    }
  }

  async registerServant(ctx: Context) {
    const callbackData = ctx.callbackQuery!["data"]
    const services = {
      button_1: "💇‍♂️ Sartaroshxona",
      button_2: "💅 Go‘zallik saloni",
      button_3: "💎 Zargarlik ustaxonasi",
      button_4: "👞 Poyabzal ustaxonasi",
      button_5: "⌚ Soatsoz"
    };

    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);

    const serviceName = services[callbackData];
    if (serviceName) {
      await ctx.answerCbQuery(`Siz ${serviceName} xizmatini tanladingiz`, { show_alert: true });
    }

    if (!servant) {
      await this.servantModel.create({
        user_id,
        username: ctx.from?.username,
        job: serviceName,
        last_state: 'first_name'
      })
      await ctx.editMessageText("📛 Iltimos, ismingizni kiriting");
    } else {
      await ctx.reply('📝 Usta menusi', servantMenu)
    }
  }

  async onRating(ctx: Context) {
    const user_id = ctx.from?.id;
    if (!user_id) return ctx.reply("🚫 Foydalanuvchi aniqlanmadi.");

    const servant = await this.servantModel.findOne({ where: { user_id } });

    if (!servant) {
      return ctx.reply("❌ Sizning reyting topilmadi. 🧐");
    }

    await ctx.replyWithHTML(servant.rating == null ? '🌟 Hozircha sizda reyting mavjud emas' : `🌟 Sizning reytingingiz: <b>${servant.rating}</b> 🎖️`);
  }

  async workTime(ctx: Context) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);
    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const contextAction = ctx.callbackQuery!["data"]

    if (servant.last_state === 'start_time') {
      servant.start_time = timeSlots[contextAction]
      servant.last_state = 'end_time'
      await servant.save();
      return await ctx.editMessageText("⏰ Ish tugatish vaqtini tanlang", {
        reply_markup:
          { inline_keyboard: endTimeKeyboard }
      });
    }

    if (servant.last_state === 'end_time') {
      servant.end_time = timeSlots[contextAction]
      servant.last_state = 'average_service_time';
      await servant.save();
      return await ctx.editMessageText("🕔 Har bir mijoz uchun o'rtacha sarflanadigan vaqtni kiriting", {
        reply_markup:
          { inline_keyboard: durationOptions }
      });
    }

    if (servant.last_state === 'average_service_time') {
      servant.average_service_time = averageTimeOptions[contextAction]
      servant.last_state = 'finish';
      await servant.save();
      await ctx.deleteMessage();
      await this.bot.telegram.sendMessage("713237173", `📋 Yangi usta \n${servant.first_name}\n${servant.phone_number}\n${servant.job}\n${servant.workshop_name}\n${servant.start_time}\n${servant.end_time}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ QABUL QILISH", callback_data: `accept_${servant.user_id}` }],
            [{ text: "❌ RAD ETISH", callback_data: `reject_${servant.user_id}` }]
          ]
        }
      });
      return await ctx.reply("⌛️ Sizning so'rovingiz yuborildi, admin tomonidan qabul qilinishini kuting", {
        parse_mode: 'HTML',
        ...Markup.keyboard([["✅ TEKSHIRISH", "❌ BEKOR QILISH"], ["📞 ADMIN BILAN BOG‘LANISH"]]).resize().oneTime()
      });
    }
  }

  async onText(ctx: Context) {
    try {
      if (!("text" in ctx.message!)) {
        return;
      }
      const user_id = ctx.from?.id;
      if (!user_id) {
        throw new Error("User ID not found");
      }

      const text = ctx.message.text.trim();
      const servant = await this.servantModel.findByPk(user_id);
      const customer = await this.customerModel.findByPk(user_id);

      if (servant) {
        if (servant.last_state === 'finish') {
          await ctx.reply("📝 Usta menusi", servantMenu)
        }

        if (servant.last_state === 'first_name') {
          servant.first_name = text;
          servant.last_state = 'phone'
          await servant.save();
          return await ctx.reply(
            "📞 Iltimos, <b>Telefon raqamingizni yuboring</b> tugmasini bosing",
            {
              parse_mode: "HTML",
              ...Markup.keyboard([[Markup.button.contactRequest("📞 Telefon raqamingizni yuborish")]])
                .resize()
                .oneTime(),
            }
          );
        }

        if (servant.last_state === 'office') {
          servant.workshop_name = text;
          servant.last_state = 'address'
          await servant.save();
          return await ctx.reply('Manzilni kiriting');
        }

        if (servant.last_state === 'address') {
          servant.address = text;
          servant.last_state = 'landmark'
          await servant.save();
          return await ctx.reply("Mo'ljalni kiriting");
        }

        if (servant.last_state === 'landmark') {
          servant.landmark = text;
          servant.last_state = 'location'
          await servant.save();
          return await ctx.reply(`Manzilni jo'nating`, {
            parse_mode: "HTML",
            ...Markup.keyboard([[Markup.button.locationRequest("📍 Manzilni yuborish")]]).resize()
          })
        }

      }

      if (customer) {
        if (customer.last_state === "finish") {
          return await ctx.reply("📝 Mijoz menyusi", customerMenu);
        }

        if (customer.last_state === 'change_name') {
          customer.first_name = text;
          customer.last_state = 'finish';
          await customer.save();
          return await ctx.reply("✅ Ism muvaffaqiyatli yangilandi!", customerMenu);
        }

        else if (customer.last_state === "name") {
          customer.first_name = text;
          customer.last_state = "phone";
          await customer.save();

          return await ctx.reply(
            "📞 Iltimos, <b>Telefon raqamingizni yuboring</b> tugmasini bosing",
            {
              parse_mode: "HTML",
              ...Markup.keyboard([[Markup.button.contactRequest("📞 Telefon raqamingizni yuborish")]])
                .resize()
                .oneTime(),
            }
          );
        }
      }
      await ctx.reply("⚠️ Botdan foydalanish uchun avval ro'yxatdan o'ting", {
        parse_mode: 'HTML',
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });

    } catch (error) {
      console.error("onText handler error:", error);
      await ctx.reply("Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring");
    }
  }

  async onCancelRegister(ctx: Context) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);
    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    await this.servantModel.destroy({ where: { user_id } });
    await ctx.deleteMessage();

    return await ctx.reply(`✅ Ro'yxatdan o'tish bekor qilindi`, {
      parse_mode: "HTML",
      ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
    })
  }

  async onCheck(ctx: Context) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);
    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    if (!servant.status) {
      return await ctx.reply('🕐 Tasdiqlash amalga oshirilmoqda...')
    }
    else {
      await ctx.reply('✅ Sizning hisobingiz faollashtirildi')
      return await ctx.reply('📝 Usta menusi', servantMenu)
    }
  }

  async onCheckCustomers(ctx: Context) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);
    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    if (!servant!.status) {
      return await ctx.reply(`🔐 Kechirasiz sizning hisobingiz faol emas`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["👨‍💼 ADMINGA XABAR YUBORISH"]]).resize().oneTime()
      });
    }

    const customers = await this.customerServiceQueueModel.findAll({
      where: { servant_id: user_id, status: 'pending' },
      order: [["date_time", "ASC"]]
    })

    if (!customers.length) {
      return await ctx.reply("🙅‍♂️ Sizda hozircha mijozlar mavjud emas");
    }

    let message = "<b>Sizning mijozlaringiz:</b>\n";
    customers.forEach(async (q) => {
      const customer = await this.customerModel.findByPk(q.customer_id);
      message += `📅 ${q.date_time.toLocaleDateString()} – ${q.date_time.toLocaleTimeString()} / ${customer?.first_name}, ${customer?.phone_number} \n`;
    });
  }

  async onMessageAdmin(ctx: Context) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);
    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    await ctx.reply("✍️ Adminga yubormoqchi bo‘lgan xabaringizni kiriting:")
  }

  async onCheckWeek(ctx: Context) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);
    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    await ctx.replyWithHTML("🗓️ Keyingi hafta jadvali", {
      reply_markup: {
        inline_keyboard: weekTable
      }
    })

  }

  async onCheckTime(ctx: Context) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);

    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    const servantTimes = await getServantBookedTimes(+user_id!, ctx, this.servantTimeTableModel, this.servantModel);

    await ctx.editMessageText(`📅 ${servantTimes!.timeTable.date}  (${servantTimes!.timeTable.weekday})  kungi ish vaqtlar jadvali`, {
      reply_markup: {
        inline_keyboard: servantTimes!.updatedTimeSlots
      }
    });
  }


  async onBackToDays(ctx: Context) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);
    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }
    await ctx.editMessageText("🗓️ Keyingi hafta jadvali", {
      reply_markup: {
        inline_keyboard: weekTable
      }
    })
  }


  async onSelectTime(ctx) {
    try {
      const callbackData = ctx.callbackQuery.data;
      const userId = ctx.from.id; // Foydalanuvchi ID olish
      const chatId = ctx.callbackQuery.message.chat.id;
      const messageId = ctx.callbackQuery.message.message_id;

      // Inline keyboard ni nusxa qilib olish
      let inlineKeyboard = JSON.parse(JSON.stringify(ctx.callbackQuery.message.reply_markup.inline_keyboard));

      const [selectedDate, selectedTime] = callbackData.replace("time-", "").split("_");
      const key = `${selectedDate}_${selectedTime}`;

      let isModified = false;

      for (const row of inlineKeyboard) {
        for (const button of row) {
          if (button.callback_data === callbackData) {
            if (button.text.includes("🔴")) {
              // 🔴 belgini olib tashlash
              button.text = button.text.replace(/\s?🔴/, "");
              await this.servantTimeTableModel.destroy({ where: { dateTime: key, user_id: userId } });
            } else {
              // 🔴 belgini qo'shish
              button.text += " 🔴";
              await this.servantTimeTableModel.create({
                user_id: userId,
                dateTime: key,
                isBooked: true
              });
            }
            isModified = true;
          }
        }
      }

      if (!isModified) return;
      await ctx.telegram.editMessageReplyMarkup(chatId, messageId, null, { inline_keyboard: inlineKeyboard });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error("❌ Xatolik:", error);
    }
  }

  async onCancelBooking(ctx) {
    const user_id = ctx.from?.id;
    const servant = await this.servantModel.findByPk(user_id);
    const messageId = ctx.callbackQuery.message.message_id;

    if (!servant) {
      return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
      });
    }

    let inlineKeyboard = JSON.parse(JSON.stringify(ctx.callbackQuery.message.reply_markup.inline_keyboard));
    let bookings: { user_id: number; dateTime: string; isBooked: boolean }[] = [];
    let isModified = false; // ✅ O‘zgarish borligini tekshirish uchun flag

    for (const row of inlineKeyboard) {
      for (const button of row) {
        if (button.callback_data.startsWith("time-") && button.text.includes("🔴")) {
          button.text = button.text.replace("🔴", "").trim();
          let dateTime = button.callback_data.replace("time-", "");
          bookings.push({ user_id, dateTime, isBooked: true });
          isModified = true;
        }
      }
    }

    if (bookings.length > 0) {
      await this.servantTimeTableModel.destroy({
        where: {
          user_id: user_id,
          dateTime: { [Op.in]: bookings.map((b) => b.dateTime) },
        }
      });
    }

    // ✅ Eski va yangi markupni solishtirish
    const oldMarkup = ctx.callbackQuery.message.reply_markup;
    const newMarkup = { inline_keyboard: inlineKeyboard };

    if (isModified && JSON.stringify(oldMarkup) !== JSON.stringify(newMarkup)) {
      await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, messageId, null, newMarkup);
    }

    await ctx.answerCbQuery("📅 Barcha vaqtlar bekor qilindi!");
  }

  async onBooking(ctx) {
    try {
      const user_id = ctx.from?.id;
      const servant = await this.servantModel.findByPk(user_id);
      const callbackData = ctx.callbackQuery.data;
      const messageId = ctx.callbackQuery.message.message_id;


      if (!servant) {
        return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
        });
      }

      let inlineKeyboard = JSON.parse(JSON.stringify(ctx.callbackQuery.message.reply_markup.inline_keyboard));
      let bookings: { user_id: number; dateTime: string; isBooked: boolean }[] = [];
      let isModified = false;
      for (const row of inlineKeyboard) {
        for (const button of row) {
          if (button.callback_data.startsWith("time-") && !button.text.includes("🔴")) {
            button.text = "🔴 " + button.text;
            bookings.push({
              user_id,
              dateTime: button.callback_data.replace("time-", ""),
              isBooked: true
            });
            isModified = true;
          }
        }
      }

      if (bookings.length > 0) {
        await this.servantTimeTableModel.bulkCreate(bookings); // Barcha vaqtlarni bazaga qo‘shish
      }

      const oldMarkup = ctx.callbackQuery.message.reply_markup;
      const newMarkup = { inline_keyboard: inlineKeyboard };

      if (isModified && JSON.stringify(oldMarkup) !== JSON.stringify(newMarkup)) {
        await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, messageId, null, newMarkup);
      }
      await ctx.answerCbQuery("📅 Barcha vaqtlar band qilindi!");

    } catch (error) {
      console.error("❌ Xatolik:", error);
    }
  }

  async onChangeDetails(ctx) {
    try {
      const user_id = ctx.from?.id;
      const servant = await this.servantModel.findByPk(user_id);
      if (!servant) {
        return await ctx.reply(`⚠️ Botdan foydalanish uchun, iltimos ro'yxatdan o'ting`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
        });
      }

      await ctx.reply("Hali tayyor emas............");

    } catch (error) {
      console.log("onChangeDetails: ", error)
    }
  }






  // =========  admin





  async onAcceptServant(ctx: Context) {
    const callbackData = ctx.callbackQuery!["data"]
    const user_id = callbackData.split("_")[1];
    const servant = await this.servantModel.findByPk(user_id);
    servant!.status = true;
    await servant?.save()
    await ctx.editMessageText(`✅ Usta tasdiqlandi:\n${servant!.first_name} (${servant!.phone_number})`);
    await this.bot.telegram.sendMessage(user_id, "✅ Sizning arizangiz tasdiqlandi! Endi xizmatlarni qabul qilishingiz mumkin.", servantMenu);
  }

  async onRejectServant(ctx: Context) {
    const callbackData = ctx.callbackQuery!["data"]
    const user_id = callbackData.split("_")[1];
    const servant = await this.servantModel.findByPk(user_id);

    await servant!.destroy();

    await ctx.editMessageText(`❌ Usta rad etildi:\n${servant!.first_name} (${servant!.phone_number})`);
    await ctx.deleteMessage(ctx.message?.message_id);
    await ctx.deleteMessage(ctx.message?.message_id! - 1);
    await this.bot.telegram.sendMessage(user_id, "❌ Afsuski, sizning so'rovingiz rad etildi.", {
      parse_mode: 'HTML',
      ...Markup.keyboard([["📝 Ro'yxatdan o'tish"]]).resize().oneTime()
    });
  }

}
