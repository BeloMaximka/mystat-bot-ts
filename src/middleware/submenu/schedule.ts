import telegraf_inline from "telegraf-inline-menu";
import { Scenes } from "telegraf";
import userStore from "../../store/userStore.js";
import { formatMessage } from "../../utils.js";

const createBackMainMenuButtons = telegraf_inline.createBackMainMenuButtons;
const MenuTemplate = telegraf_inline.MenuTemplate;

// const newmsgSymbol = "!new";
const nextMsgSymbol = "\n";
const maxMsgLength = 9500;
const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

const formatDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = dateFormatOptions
) => {
  return date
    .toLocaleDateString("ko-KR", options)
    .replace(/\. /g, "-")
    .slice(0, -1);
};

const formatSchedule = (scheduleEntry: any) => {
  return formatMessage(
    `✏️ Предмет: ${scheduleEntry?.subject_name}`,
    `💡 Преподаватель: ${scheduleEntry?.teacher_name}`,
    `🗝 Аудитория: ${scheduleEntry?.room_name}`,
    `⏰ Время: ${scheduleEntry?.started_at} - ${scheduleEntry?.finished_at}`
  );
};

const getScheduleFormatted = async (
  ctx: Scenes.WizardContext,
  title: string,
  day?: number
): Promise<string> => {
  const date = new Date();

  if (day) {
    date.setDate(day);
  }

  const schedule = await userStore.get(ctx.chat?.id)?.getScheduleByDate(date);
  let scheduleFormatted = "";

  if (!schedule || !schedule.success) {
    return "🚫 При получении расписания возникла ошибка: " + schedule?.error;
  } else if (schedule.data.length === 0) {
    return "🎉 Нет пар";
  }

  for (const scheduleEntry of schedule.data) {
    scheduleFormatted += formatSchedule(scheduleEntry);
  }

  return [title + "\n", scheduleFormatted].join("\n");
};

const getCurrentWeek = () => {
  const weekStart = new Date();
  const dayOfWeek = weekStart.getDay() === 0 ? 7 : weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dayOfWeek - 1));
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }

  return dates;
};

const getWeekScheduleMarkdown = async (
  ctx: Scenes.WizardContext
): Promise<string> => {
  const weekDays = getCurrentWeek();
  const schedule = await userStore
    .get(ctx.chat?.id)
    ?.getMonthSchedule(new Date());

  if (!schedule || !schedule.success) {
    return "🚫 При получении расписания возникла ошибка: " + schedule?.error;
  } else if (schedule.data.length === 0) {
    return "🎉 Нет пар";
  }

  const scheduleWeekDays = new Map<string, any[]>();
  for (const dayOfWeek of weekDays) {
    const scheduleEntries = schedule.data.filter(
      (s: any) => s.date === dayOfWeek
    );
    scheduleWeekDays.set(dayOfWeek, scheduleEntries);
  }

  let scheduleFormatted = "";
  for (const dayOfWeek of weekDays) {
    scheduleFormatted += `*Расписание на ${dayOfWeek
      .split("-")
      .reverse()
      .join(".")}*\n\n`;
    const scheduleEntries = scheduleWeekDays.get(dayOfWeek) as any[];

    if (scheduleEntries.length !== 0) {
      for (const scheduleEntry of scheduleEntries) {
        scheduleFormatted += formatSchedule(scheduleEntry);
      }
    } else {
      scheduleFormatted += "🎉 Нет пар\n";
    }

    scheduleFormatted += nextMsgSymbol;
  }

  return scheduleFormatted;
};

const getDateString = (date: Date = new Date()) =>
  date.toLocaleString().substring(3, 10);
const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

const getDaysArray = async (
  date: Date,
  ctx: Scenes.WizardContext
): Promise<string[]> => {
  const totalButtons = 35;
  const totalDays = daysInMonth(date.getFullYear(), date.getMonth() + 1);
  const days: string[] = [];
  const schedule = await userStore.get(ctx.chat?.id)?.getMonthSchedule(date);

  // empty buttons before
  date.setDate(1);
  for (let count = 0; count < date.getDay() - 1; count++) {
    days.push(" ");
  }

  // actual buttons
  for (let count = 0; count < totalDays; count++) {
    date.setDate(count + 1);

    const currentDate = formatDate(date);

    if (schedule?.data.some((elem: any) => elem.date === currentDate)) {
      days.push("🟢" + String(count + 1));
    } else {
      days.push("🔴" + String(count + 1));
    }
  }

  // empty buttons after
  date.setDate(1);
  for (
    let count = 0;
    count < totalButtons - totalDays - date.getDay() + 1;
    count++
  ) {
    days.push(" ");
  }

  return days;
};

const scheduleTodaySubmenu = new MenuTemplate<Scenes.WizardContext>(
  async (ctx) => await getScheduleFormatted(ctx, "Раписание на сегодня")
);
scheduleTodaySubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

const scheduleTomorrowSubmenu = new MenuTemplate<Scenes.WizardContext>(
  async (ctx) =>
    await getScheduleFormatted(
      ctx,
      "Раписание на завтра",
      new Date().getDate() + 1
    )
);
scheduleTomorrowSubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

const scheduleWeekSubmenu = new MenuTemplate<Scenes.WizardContext>(
  async (ctx) => {
    const msg = await getWeekScheduleMarkdown(ctx);

    if (msg.length < maxMsgLength) {
      return {
        text: msg,
        parse_mode: "Markdown",
      };
    } else {
      return "❗️ Сообщение оказалось слишком длинным. Попробуйте посмотреть отдельно по дням.";
    }

    // const partsByDay = msg.split(newmsgSymbol).filter((s) => !!s);

    // for (const message of partsByDay) {
    //   await ctx.replyWithMarkdown(message);
    // }
    // await ctx.reply("Вернутся в меню 👉 /menu");

    // return "Расписание на неделю";
  }
);
scheduleWeekSubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

const monthScheduleEntrySubmenu = new MenuTemplate<any>(async (ctx) => {
  const day = ctx.match[1].match(/\d+| /)[0]; // extract number or space symbol

  if (day === " ") {
    return "🎉 Нет пар";
  }

  return await getScheduleFormatted(
    ctx,
    `Расписание на ${day}.${getDateString()}`,
    parseInt(day)
  );
});
monthScheduleEntrySubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

const monthScheduleSubmenu = new MenuTemplate<Scenes.WizardContext>(
  () => `Расписание на ${getDateString()}`
);
monthScheduleSubmenu.chooseIntoSubmenu(
  "schedule-month-days",
  async (ctx) => await getDaysArray(new Date(), ctx),
  monthScheduleEntrySubmenu,
  { columns: 7 }
);
monthScheduleSubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

export {
  scheduleTodaySubmenu,
  scheduleTomorrowSubmenu,
  scheduleWeekSubmenu,
  monthScheduleSubmenu,
};
