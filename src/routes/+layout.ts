import { browser } from '$app/environment';

export const prerender = true;
export const ssr = false;

export const load = async () => {
    if (!browser) return;

    const { attachConsole } = await import('tauri-plugin-log-api');
    const { default: init_i18n } = await import('$lib/i18n');

    await init_i18n();

    await attachConsole();
};
