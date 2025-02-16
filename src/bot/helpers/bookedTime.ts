import { Context } from "telegraf";
import { getTimeTable } from "../keyboards/inlineKeyboard";
import { Servant } from "../models/servant.model";
import { ServantTimeTable } from "../models/servantTimeTable.model";

export async function getServantBookedTimes(
  user_id: number,
  ctx: Context,
  servantTimeTableModel: typeof ServantTimeTable,
  servantModel: typeof Servant
) {
  const bookedTimes = await servantTimeTableModel.findAll({ where: { user_id } });
  const servant = await servantModel.findByPk(user_id);

  if (!servant) {
    console.error("❌ Servant not found!");
    return null;  
  }

  const callbackData = ctx.callbackQuery!['data']; 

  const datePart = callbackData.split("_")[1];


  const bookedTimeSet = new Set(bookedTimes.map(bt => bt.dateTime));
  const timeTable = getTimeTable(datePart, servant.start_time, servant.end_time, servant.average_service_time);

  const updatedTimeSlots = timeTable.timeSlots.map(row =>
    row.map(button => {
      const extractedTime = button.callback_data.split("time-")[1];
      if (bookedTimeSet.has(extractedTime)) {
        button.text = `🔴 ${button.text}`;
      }
      return button;
    })
  );

  return {
    timeTable,
    updatedTimeSlots
  };
}
