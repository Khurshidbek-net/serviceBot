import { Action, Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';


@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) { }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.start(ctx);
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context) {
    await this.botService.onContact(ctx);
  }

  @On("location")
  async onLocation(@Ctx() ctx: Context) {
    await this.botService.onLocation(ctx);
  }

  @Hears("📝 Ro'yxatdan o'tish")
  async onRegister(@Ctx() ctx: Context) {
    await this.botService.register(ctx);
  }

  

  // customer

  @Hears("👥 Mijoz")
  async onCustomer(@Ctx() ctx: Context) {
    await this.botService.registerCustomer(ctx);
  }

  @Hears("📋 XIZMATLAR")
  async onCustomerServices(@Ctx() ctx: Context) {
    await this.botService.customer(ctx);
  }

  @Hears("⚙️ MA’LUMOTLARNI O’ZGARTIRISH")
  async onCustomerInfo(@Ctx() ctx: Context) {
    await this.botService.customerChangeInfo(ctx);
  }

  @Hears("✅ TANLANGAN XIZMATLAR")
  async onCustomerChosenServices(@Ctx() ctx: Context) {
    await this.botService.customerChosenServices(ctx);
  }

  @Hears("📅 VAQT OLISH")
  async onChooseServentTime(@Ctx() ctx: Context) {
    console.log("keldioooooooooooo")
    await this.botService.onChooseServentTime(ctx);
  }

  @Action(/^service_+\d+/)
  async OnClickServiceByCustomer(ctx: Context) {
    await this.botService.OnClickServiceByCustomer(ctx);
  }

  @Action("ism")
  async OnClickName(ctx: Context){
    await this.botService.onClickName(ctx);
  }

  @Action("rating")
  async onClickRating(ctx: Context) {
    await this.botService.onClickRating(ctx);
  }

  @Action(/^servant-+\d+/)
  async onClickServant(ctx: Context) {
    await this.botService.onClickServant(ctx);
  }

  @Action(/^manzil-+\d+/)
  async onClickServantLocation(ctx: Context) {
    await this.botService.onClickServantLocation(ctx);
  }

  @Action("customer_back")
  async onCustomerBack(ctx: Context) {
    await this.botService.onCustomerBack(ctx);
  }



  @Action(/^change_/)
  async OnClickChange(ctx: Context){
    await this.botService.onClickChange(ctx);
  }

  @Action('cancel_service')
  async OnClickCancelService(ctx: Context) {
    await this.botService.cancelService(ctx);
  }

  @Action('send_message')
  async OnClickSendMessage(ctx: Context) {
    await this.botService.sendMessage(ctx);
  }

  // servant 

  @Action(/^button_+\d+/)
  async OnClickServices(ctx: Context) {
    await this.botService.registerServant(ctx);
  }

  @Action(/^time_/)
  async OnClickTime(ctx: Context) {
    await this.botService.workTime(ctx);
  }

  @Hears("🛠 Usta")
  async onServant(@Ctx() ctx: Context) {
    await this.botService.servant(ctx);
  }

  @Hears("⭐ REYTING")
  async onRating(@Ctx() ctx: Context) {
    await this.botService.onRating(ctx);
  }

  @Hears("❌ BEKOR QILISH")
  async onCancelRegister(@Ctx() ctx: Context) {
    await this.botService.onCancelRegister(ctx);
  }

  @Hears("✅ TEKSHIRISH")
  async onCheck(@Ctx() ctx: Context) {
    await this.botService.onCheck(ctx);
  }

  @Hears("📞 ADMIN BILAN BOG‘LANISH")
  async onMessageAdmin(@Ctx() ctx: Context) {
    await this.botService.onMessageAdmin(ctx);
  }

  @Hears("👥 MIJOZLAR")
  async onCheckCustomers(@Ctx() ctx: Context) {
    await this.botService.onCheckCustomers(ctx);
  }

  @Hears("⏳ VAQT")
  async onCheckWeek(@Ctx() ctx: Context) {
    await this.botService.onCheckWeek(ctx);
  }

  @Hears("⚙️ MA’LUMOTLARNI YANGILASH")
  async onChangeDetails(@Ctx() ctx: Context) {
    await this.botService.onChangeDetails(ctx);
  }

  @Action(/^week_/)
  async onCheckTime(ctx: Context){
    await this.botService.onCheckTime(ctx);
  }

  @Action("back")
  async onBackToDays(ctx: Context){
    await this.botService.onBackToDays(ctx);
  }

  @Action(/^time-.+/)
  async onSelectTime(ctx: Context){
    await this.botService.onSelectTime(ctx);
  }

  @Action('Time_button_1')
  async onCancelBooking(@Ctx() ctx: Context) {
    await this.botService.onCancelBooking(ctx);
  }

  @Action('Time_button_2')
  async onBooking(@Ctx() ctx: Context) {
    await this.botService.onBooking(ctx);
  }


  // ====== admin

  @Action(/^accept_/)
  async onAcceptServant(@Ctx() ctx: Context) {
    await this.botService.onAcceptServant(ctx);
  }

  @Action(/^reject_/)
  async onRejectServant(@Ctx() ctx: Context) {
    await this.botService.onRejectServant(ctx);
  }

  




  @On("text")
  async onText(@Ctx() ctx: Context) {
    await this.botService.onText(ctx);
  }

}
