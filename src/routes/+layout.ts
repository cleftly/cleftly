import { browser } from '$app/environment';

export const prerender = true;
export const ssr = false;

export const load = async () => {
    if (!browser) return;

    const { attachConsole } = await import('tauri-plugin-log-api');
    const { default: init_i18n } = await import('$lib/i18n');
    const { default: taurievents } = await import('$lib/taurievents');
    const { default: db } = await import('$lib/db');

    await init_i18n();

    await attachConsole();

    await taurievents();

    const filteredPlaylists = await db.playlists.get('0000-0000-0000-0001');

    if (!filteredPlaylists) {
        await db.playlists.add({
            id: '0000-0000-0000-0001',
            name: '❤️',
            trackIds: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
};
