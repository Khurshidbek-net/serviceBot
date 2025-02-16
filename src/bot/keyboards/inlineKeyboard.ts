import moment from "moment";
import { text } from "stream/consumers";
import { Markup } from "telegraf";
import { callback } from "telegraf/typings/button";

export const startTimeKeyboard = [
  [
    { text: "🟢 08:00", callback_data: "time_8" },
    { text: "🟢 09:00", callback_data: "time_9" }
  ],
  [
    { text: "🟢 10:00", callback_data: "time_10" },
    { text: "🟢 11:00", callback_data: "time_11" }
  ], 
  [
    { text: "🔴 12:00", callback_data: "time_12" },
    { text: "🔴 13:00", callback_data: "time_13" }
  ]
];

export const endTimeKeyboard = [
  [
    { text: "🟢 18:00", callback_data: "time_18" },
    { text: "🟢 19:00", callback_data: "time_19" }
  ],
  [
    { text: "🟡 20:00", callback_data: "time_20" },
    { text: "🟡 21:00", callback_data: "time_21" }
  ],
  [
    { text: "🔴 22:00", callback_data: "time_22" },
    { text: "🔴 23:00", callback_data: "time_23" }
  ]
];

export const timeSlots = {
  time_8: "🟢 08:00",
  time_9: "🟢 09:00",
  time_10: "🟡 10:00",
  time_11: "🟡 11:00",
  time_12: "🔴 12:00",
  time_13: "🔴 13:00",
  time_18: "🟢 18:00",
  time_19: "🟢 19:00",
  time_20: "🟡 20:00",
  time_21: "🟡 21:00",
  time_22: "🔴 22:00",
  time_23: "🔴 23:00",
};

export const durationOptions = [
  [
    { text: '⏳ 20 daqiqa', callback_data: 'time_duration_20' },
    { text: '⏳ 30 daqiqa', callback_data: 'time_duration_30' },
    { text: '⏳ 40 daqiqa', callback_data: 'time_duration_40' },
  ],
  [
    { text: '⏳ 1 soat', callback_data: 'time_duration_60' },
    { text: '⏳ 1.5 soat', callback_data: 'time_duration_90' },
    { text: '⏳ 2 soat', callback_data: 'time_duration_180' },
  ],
]

export const averageTimeOptions = {
  time_duration_20: '⏳ 20 daqiqa',
  time_duration_30: '⏳ 30 daqiqa',
  time_duration_40: '⏳ 40 daqiqa',
  time_duration_60: '⏳ 1 soat',
  time_duration_90: '⏳ 1.5 soat',
  time_duration_180: '⏳ 2 soat',
}

const today = new Date();
const weekDays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export const weekTable = Array.from({ length: 7 }, (_, i) => {
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + i); 

  const dayName = weekDays[futureDate.getDay()];
  const dayNumber = `${futureDate.getDate()}.${(futureDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;

  return {
    text: `${dayName}: ${dayNumber}`,
    callback_data: `week_${futureDate.getDate()}-${futureDate.getMonth() + 1}-${futureDate.getFullYear()}`
  };
}).reduce((acc, curr, index) => {
  if (index % 2 === 0) acc.push([curr]); 
  else acc[acc.length - 1].push(curr);
  return acc;
}, [] as { text: string; callback_data: string }[][]);


export function getTimeTable(
  selectedDate: string, 
  start_time: string,
  end_time: string,
  average_service_time: string
): { date: string; weekday: string; timeSlots: { text: string; callback_data: string; }[][] } {

  const weekdays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

  const dateParts = selectedDate.split("-");
  const dateObj = new Date(Number(dateParts[2]), Number(dateParts[1]), Number(dateParts[0]));
  const weekday = weekdays[dateObj.getDay()];

  const cleanStartTime = start_time.replace(/[^\d:]/g, "");
  const cleanEndTime = end_time.replace(/[^\d:]/g, "");
  const cleanServiceTime = parseInt(average_service_time.replace(/[^\d]/g, ""), 10);

  const [startHour, startMinute] = cleanStartTime.split(":").map(Number);
  const [endHour, endMinute] = cleanEndTime.split(":").map(Number);

  let timeSlots: { text: string; callback_data: string; }[][] = [];
  let row: { text: string; callback_data: string; }[] = [];

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    let formattedTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    row.push({ text: `${formattedTime}`, callback_data: `time-${selectedDate}_${formattedTime}` });

    if (row.length === 3) {
      timeSlots.push(row);
      row = [];
    }

    currentMinute += cleanServiceTime;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  if (row.length > 0) {
    timeSlots.push(row);
  }

  const timeButtons = [
    [
      { text: "✅ Bekor qilish", callback_data: 'Time_button_1' },
      { text: "❌ Band qilish", callback_data: 'Time_button_2' }
    ],
    [
      { text: '⬅️ Orqaga', callback_data: 'back' }
    ]
  ];

  timeSlots = [...timeSlots, ...timeButtons];

  return { date: selectedDate, weekday, timeSlots };
}








