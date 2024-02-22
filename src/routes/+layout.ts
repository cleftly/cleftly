import { attachConsole } from 'tauri-plugin-log-api';
import { browser } from '$app/environment';
import init_i18n from '$lib/i18n';

export const prerender = true;
export const ssr = false;

export const load = async () => {
    if (!browser) return;

    await init_i18n();

    await attachConsole();
};
