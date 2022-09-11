import { MystatHomeworkStatus } from "mystat-api/dist/types.js";
import telegraf_inline from "telegraf-inline-menu";
import { Scenes } from "telegraf";
import userStore from "../../store/userStore.js";
import {
  formatMessage,
  getSessionValue,
  setSessionValue,
} from "../../utils.js";

const createBackMainMenuButtons = telegraf_inline.createBackMainMenuButtons;
const MenuTemplate = telegraf_inline.MenuTemplate;

enum HomeworkStatusTypes {
  Overdue = "🔥Просроченные",
  Checked = "📩Выполненные",
  Uploaded = "📥Загруженные",
  Active = "📨Текущие",
  Deleted = "🗑Удаленные",
}

const homeworkStatusList = [
  HomeworkStatusTypes.Active,
  HomeworkStatusTypes.Checked,
  HomeworkStatusTypes.Uploaded,
  HomeworkStatusTypes.Overdue,
  HomeworkStatusTypes.Deleted,
];

const homeworkStatusTitles = {
  [HomeworkStatusTypes.Active]: MystatHomeworkStatus.Active,
  [HomeworkStatusTypes.Checked]: MystatHomeworkStatus.Checked,
  [HomeworkStatusTypes.Uploaded]: MystatHomeworkStatus.Uploaded,
  [HomeworkStatusTypes.Overdue]: MystatHomeworkStatus.Overdue,
  [HomeworkStatusTypes.Deleted]: MystatHomeworkStatus.Deleted,
};

async function getHomeworksByMatch(ctx: any): Promise<unknown[]> {
  const match: string = ctx.match[1];
  const homeworkStatus = homeworkStatusTitles[match as HomeworkStatusTypes];
  const homeworks = await userStore
    .get(ctx.chat?.id)
    ?.getHomeworkList(
      homeworkStatus,
      getSessionValue<number>(ctx, "page") || 1
    );
  setSessionValue<unknown[]>(ctx, "homeworks", homeworks?.data);

  return homeworks?.data;
}

const selectedHomeworkSubmenu = new MenuTemplate<any>((ctx) => {
  return ctx.match[2];
});
selectedHomeworkSubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

const selectedHomeworkListSubmenu = new MenuTemplate<any>(
  (ctx) => ctx.match[1]
);
selectedHomeworkListSubmenu.manualRow(async (ctx: Scenes.WizardContext) => {
  const homeworks = await getHomeworksByMatch(ctx);
  setSessionValue<number>(ctx, "page", 0);
  console.log(homeworks);

  const format = (h: any) => ({
    text: h.name_spec,
    relativePath: "hw-list:" + h.id,
  });

  return [
    homeworks.slice(0, 2).map((h) => format(h)),
    homeworks.slice(2, 4).map((h) => format(h)),
    homeworks.slice(4, 6).map((h) => format(h)),
  ];
});

selectedHomeworkListSubmenu.manualAction(
  /hw-list:(\d+)$/,
  async (ctx: any, path: string) => {
    const parts: string[] = path.split(":");
    const id: number = parseInt(parts[parts.length - 1]);
    const homeworkMenuPath: string =
      ctx.update.callback_query.data.split(/\d+/)[0]; // 'menu/hw/hw-opt:{SMTH}/hw-list:' w/o id
    console.log(ctx.update.callback_query.data, homeworkMenuPath);

    const homework = getSessionValue<any[]>(ctx, "homeworks")?.find(
      (h) => h.id === id
    );

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
        `✅ Проверенно: ${
          homework?.homework_stud?.creation_time || "Нет информации"
        }`,
        `🎉 Оценка: ${homework?.homework_stud?.mark || "Нет информации"}`
      ),
      { parse_mode: "Markdown" }
    );

    ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [
          {
            text: "⬅️ Назад",
            callback_data: homeworkMenuPath,
          },
        ],
      ],
    });

    return false;
  }
);

selectedHomeworkListSubmenu.pagination("hw-pg", {
  getTotalPages: async (ctx) => {
    const hwPerPage = 6;
    const hwCount = (await getHomeworksByMatch(ctx))?.length;
    const currentPage = getSessionValue<number>(ctx, "page") || 1;
    return hwCount >= hwPerPage ? currentPage + 1 : currentPage;
  },
  setPage: (ctx, page) => setSessionValue<number>(ctx, "page", page),
  getCurrentPage: (ctx) => getSessionValue<number>(ctx, "page"),
});

selectedHomeworkListSubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

const homeworkSubmenu = new MenuTemplate<Scenes.WizardContext>(
  () => "Выберите тип домашнего задания"
);
homeworkSubmenu.chooseIntoSubmenu(
  "hw-opt",
  homeworkStatusList,
  selectedHomeworkListSubmenu,
  { columns: 1 }
);
homeworkSubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

export default homeworkSubmenu;
