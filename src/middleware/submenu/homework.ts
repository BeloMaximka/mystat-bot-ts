import telegraf_inline from "telegraf-inline-menu";
import { Context } from "vm";
import { getHomeworkList } from "mystat-api";
import { HomeworkStatus } from "../../types.js";
import { formatMessage, getSessionValue, getUserDataFromSession, setSessionValue } from "../../utils.js";

const createBackMainMenuButtons = telegraf_inline.createBackMainMenuButtons;
const MenuTemplate = telegraf_inline.MenuTemplate;

enum HomeworkStatusTypes {
    Overdue = 'Просроченные',
    Checked = 'Выполненные',
    Uploaded = 'Загруженные',
    Active = 'Текущие',
    Deleted = 'Удаленные'
}

const homeworkStatusList = [
    HomeworkStatusTypes.Active,
    HomeworkStatusTypes.Checked,
    HomeworkStatusTypes.Uploaded,
    HomeworkStatusTypes.Overdue,
    HomeworkStatusTypes.Deleted
];

function getHomeworkStatusByMatch(match: string): number {
    switch (match) {
        case HomeworkStatusTypes.Active:
            return HomeworkStatus.Active;
        
        case HomeworkStatusTypes.Checked:
            return HomeworkStatus.Checked;
        
        case HomeworkStatusTypes.Deleted:
            return HomeworkStatus.Deleted;
        
        case HomeworkStatusTypes.Overdue:
            return HomeworkStatus.Overdue;
    
        case HomeworkStatusTypes.Uploaded:
            return HomeworkStatus.Uploaded;
        
        default:
            return -1;
    }
}

async function getHomeworksByMatch(ctx: Context): Promise<unknown[]> {
    const match: string = ctx.match[1];
    const homeworkStatus = getHomeworkStatusByMatch(match);
    const homeworks = await getHomeworkList(getUserDataFromSession(ctx), homeworkStatus);
    setSessionValue<unknown[]>(ctx, 'homeworks', homeworks.data);
    
    return homeworks.data;
}

const selectedHomeworkSubmenu = new MenuTemplate<Context>((ctx) => {
    console.log(ctx.match);
    
    return ctx.match[2];
});
selectedHomeworkSubmenu.manualRow(createBackMainMenuButtons('⬅️ Назад'));

const selectedHomeworkListSubmenu = new MenuTemplate<Context>((ctx) => ctx.match[1]);
selectedHomeworkListSubmenu.manualRow(async (ctx: Context) => {
    const homeworks = await getHomeworksByMatch(ctx);

    const format = (h: any) => ({ text: h.name_spec, relativePath: 'hw-list:' + h.id });

    return [
        homeworks.slice(0, 2).map(h => format(h)),
        homeworks.slice(2, 4).map(h => format(h)),
        homeworks.slice(4, 6).map(h => format(h)),
    ];
});

selectedHomeworkListSubmenu.manualAction(/hw-list:(\d+)$/, async (ctx: Context, path: string) => {
    const parts: string[] = path.split(':');
    const id: number = parseInt(parts[parts.length - 1]);
    const homework = getSessionValue<any[]>(ctx, 'homeworks')?.find(h => h.id === id);

    await ctx.editMessageText(
        formatMessage(
            `✏️ Предмет: ${homework?.name_spec}`,
            `📖 Тема: ${homework?.theme}`,
            `💡 Преподаватель: ${homework?.fio_teach}`,
            `📅 Дата выдачи: ${homework?.creation_time}`,
            `❕ Сдать до: ${homework?.completion_time}`,
            `✒️ Комментарий: ${homework?.comment}`,
            `📁 Путь к файлу: [ссылка](${homework?.file_path})`,
            `📂 Путь к загруженному файлу: [ссылка](${homework?.homework_stud?.file_path})`,
            `✅ Проверенно: ${homework?.homework_stud?.creation_time || 'Нет информации'}`,
            `🎉 Оценка: ${homework?.homework_stud?.mark || 'Нет информации'}`
        ),
        { parse_mode: 'Markdown' }
    );

    ctx.editMessageReplyMarkup({
        inline_keyboard: [
            [
                {
                    text: '⬅️ Назад',
                    callback_data: 'menu/hw/hw-list/',
                }
            ],
        ]
    });

    return false;
});
selectedHomeworkListSubmenu.manualRow(createBackMainMenuButtons('⬅️ Назад'));

const homeworkSubmenu = new MenuTemplate<Context>(() => 'Выберите тип домашнего задания');
homeworkSubmenu.chooseIntoSubmenu('hw-opt', homeworkStatusList, selectedHomeworkListSubmenu, { columns: 1 });
homeworkSubmenu.manualRow(createBackMainMenuButtons('⬅️ Назад'));

export default homeworkSubmenu;