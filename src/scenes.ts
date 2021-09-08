import Telegraf from "telegraf";
//{ deunionize, Scenes }
const Scenes = Telegraf.Scenes;
const deunionize = Telegraf.deunionize;
import { authUser} from "mystat-api"
import { getUserDataFromSession } from "./utils.js";
import { createUser } from "./database/database.js";
import { IUserData } from "./types.js";

const loginScene = new Scenes.WizardScene<Telegraf.Scenes.WizardContext>(
    'login',
    async (ctx) => {
        await ctx.reply('📲 Отправьте свой логин от mystat');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const username = deunionize(ctx.message)?.text;

        if (!username) {
            return await ctx.reply('Логин должен быть текстом');
        }

        (ctx.session as any).username = username;

        ctx.deleteMessage(ctx.message?.message_id);
        await ctx.reply('🔑 Теперь оправьте свой пароль от mystat');

        return ctx.wizard.next();
    },
    async (ctx) => {
        const password = deunionize(ctx.message)?.text;

        if (!password) {
            return await ctx.reply('Пароль должен быть текстом');
        }

        (ctx.session as any).password = password;

        ctx.deleteMessage(ctx.message?.message_id);
        ctx.reply('🔍 Обработка информации');

        const userData: IUserData = getUserDataFromSession(ctx);
        const authData = await authUser(userData.username, userData.password);
        const isAuth = (await authData).success;
        const chatId = ctx.chat?.id;

        if (!chatId) {
            await ctx.reply('🚫 Что-то пошло не так.');
            return await ctx.scene.leave();
        }

        if (!isAuth) {
            await ctx.reply('🔒 При входе возникла ошибка. Проверьте логин и пароль.');
        } else {
            await ctx.reply('🔓 Вход успешно выполнен');
            await ctx.reply('Используйте /menu чтобы перейти в меню');
            await createUser({ username: userData.username, password: userData.password, chatId });
        }

        return await ctx.scene.leave();
    }
)

export default {
    login: loginScene
}