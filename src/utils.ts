import { IUserData } from "./types.js";

export function getUserDataFromSession(ctx: any): IUserData {
    return {
        username: ctx.session.username as string,
        password: ctx.session.password as string
    }
}

export function setSessionValue<T>(ctx: any, fieldName: string, value: T | null): void {
    ctx.session[fieldName] = value;
}

export function getSessionValue<T>(ctx: any, fieldName: string): T | null {
    return ctx.session[fieldName] as T | null;
}

export function formatMessage(...parts: string[]): string {
    return [
        ...parts,
        '\n'
    ].join('\n');
}
