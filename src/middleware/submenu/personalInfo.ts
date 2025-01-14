import telegraf_inline from "telegraf-inline-menu";
import { Scenes } from "telegraf";
import userStore from "../../store/userStore.js";
import { formatMessage } from "../../utils.js";
import { getErrorMessage } from "../../helpers/logger.js";

const createBackMainMenuButtons = telegraf_inline.createBackMainMenuButtons;
const MenuTemplate = telegraf_inline.MenuTemplate;

const personalInfoSubmenu = new MenuTemplate<Scenes.WizardContext>(
  async (ctx) => {
    const info = await userStore.get(ctx.chat?.id)?.getProfileInfo();
    const settings = await userStore.get(ctx.chat?.id)?.getUserSettings();

    if (!info || !settings || !info.success || !settings.success) {
      return getErrorMessage(info?.error ? info.error : settings?.error);
    }

    const i = info.data;
    const s = settings.data;

    const infoFromatted = formatMessage(
      `📝 ФИО: ${i.full_name}`,
      `🧭 Группа: ${i.group_name}`,
      `🖥 Поток: ${i.stream_name}`,
      `🔍 Фото: <a href="${i.photo}">фото</a>`,
      `💰 Количество монет: ${i.gaming_points[1].points}`,
      `💎 Количество кристаллов: ${i.gaming_points[0].points}`,
      `📈 Всего поинтов: ${
        i.gaming_points[0].points + i.gaming_points[1].points
      }`,
      `💡 Количество достижений: ${i.achieves_count}`,
      `⚙️ Уровень профиля: ${i.level}`,
      `📡 Почта для входа в Azure: ${s.azure_login}`,
      `🪓 Почта: ${s.email}`,
      `📱 Телефон: ${s.phones[0].phone_number}`
    );

    return {
      text: infoFromatted,
      parse_mode: "HTML",
    };
  }
);
personalInfoSubmenu.manualRow(createBackMainMenuButtons("⬅️ Назад"));
export default personalInfoSubmenu;
