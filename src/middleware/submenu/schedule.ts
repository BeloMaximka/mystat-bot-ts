import { getScheduleByDate } from "mystat-api";
import { createBackMainMenuButtons, MenuTemplate } from "telegraf-inline-menu";
import { Context } from "vm";
import { formatMessage, getUserDataFromSession } from "../../utils.js";

const getScheduleFormatted = async (ctx: Context, title: string, day?: number): Promise<string> => {
    const date = new Date();

    if (day) {
        date.setDate(day);
    }

    const schedule = await getScheduleByDate(getUserDataFromSession(ctx), date);
    let scheduleFormatted = '';

    if (!schedule.success) {
        return '🚫 При получении расписания возникла ошибка: ' + schedule.error;
    } else if (schedule.data.length === 0) {
        return '🎉 Нет пар';
    }

    for (const scheduleEntry of schedule.data) {
        scheduleFormatted += formatMessage(
            `✏️ Предмет: ${scheduleEntry.subject_name}`,
            `💡 Преподаватель: ${scheduleEntry.teacher_name}`,
            `🗝 Аудитория: ${scheduleEntry.room_name}`,
            `⏰ Время: ${scheduleEntry.started_at} - ${scheduleEntry.finished_at}`,
        );
    }

    return [
        title + '\n',
        scheduleFormatted
    ].join('\n');
}

const getDateString = (date: Date = new Date()) => date.toLocaleString().substring(3, 10);
const daysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();
const getDaysArray = (date: Date): string[] => {
    const totalButtons = 35;
    const totalDays = daysInMonth(date.getFullYear(), date.getMonth() + 1);
    const days: string[] = [];

    // actual buttons
    for (let count = 0; count < totalDays; count++) {
        days.push(String(count + 1));
    }

    // empty buttons
    for (let count = 0; count < totalButtons - totalDays; count++) {
        days.push(' ');
    }

    return days;
}

const scheduleTodaySubmenu = new MenuTemplate<Context>(async (ctx) => await getScheduleFormatted(ctx, 'Раписание на сегодня'));
scheduleTodaySubmenu.manualRow(createBackMainMenuButtons('⬅️ Назад'));

const scheduleTomorrowSubmenu = new MenuTemplate<Context>(async (ctx) => await getScheduleFormatted(ctx, 'Раписание на завтра', (new Date().getDate() + 1)));
scheduleTomorrowSubmenu.manualRow(createBackMainMenuButtons('⬅️ Назад'));

const monthScheduleEntrySubmenu = new MenuTemplate<Context>(async (ctx) => {
    const day = ctx.match[1];

    if (day === ' ') {
        return '🎉 Нет пар';
    }

    return await getScheduleFormatted(ctx, `Расписание на ${day}.${getDateString()}`, parseInt(day));
});
monthScheduleEntrySubmenu.manualRow(createBackMainMenuButtons('⬅️ Назад'));

const monthScheduleSubmenu = new MenuTemplate<Context>(() => `Расписание на ${getDateString()}`);
monthScheduleSubmenu.chooseIntoSubmenu('schedule-month-days', getDaysArray(new Date()), monthScheduleEntrySubmenu, { columns: 7 });
monthScheduleSubmenu.manualRow(createBackMainMenuButtons('⬅️ Назад'));

export {
    scheduleTodaySubmenu,
    scheduleTomorrowSubmenu,
    monthScheduleSubmenu
}