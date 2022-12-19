import telegraf_inline from "telegraf-inline-menu";
import { Scenes } from "telegraf";
import userStore from "../../store/userStore.js";
import {
  cropString,
  formatMessage,
  getSessionValue,
  setSessionValue,
} from "../../utils.js";
import { MystatExam } from "mystat-api/dist/types.js";

const formatString = (source: string): string => cropString(source, 20);

const createBackMainMenuButtons = telegraf_inline.createBackMainMenuButtons;
const MenuTemplate = telegraf_inline.MenuTemplate;

const getExamsList = async (ctx: Scenes.WizardContext): Promise<string[]> => {
  const exams = await userStore.get(ctx.chat?.id)?.getExams();

  if (!exams || !exams.success) {
    return [];
  }

  setSessionValue<MystatExam[]>(ctx, "exams", exams.data);

  return exams.data.map((e: any) => formatString(e.spec));
};

const allExamsEntrySubmenu = new MenuTemplate<any>(async (ctx) => {
  const match: string = ctx.match[1];
  const exam = getSessionValue<MystatExam[]>(ctx, "exams").find(
    (e) => formatString(e.spec) === match
  );

  const examFormatted = formatMessage(
    `✏️ Предмет: ${exam?.spec}`,
    `⏰ Дата: ${exam?.date}`,
    `💰 Преподаватель: ${exam?.teacher}`,
    `🕯 Оценка: ${exam?.mark}`
  );

  return [exam?.spec, examFormatted].join("\n");
});
allExamsEntrySubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

const allExamsSubmenu = new MenuTemplate<Scenes.WizardContext>(
  () => "Все экзамены"
);
allExamsSubmenu.chooseIntoSubmenu(
  "exams",
  async (ctx) => await getExamsList(ctx),
  allExamsEntrySubmenu,
  { columns: 2 }
);
allExamsSubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));

export default allExamsSubmenu;
