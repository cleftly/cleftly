import { browser } from '$app/environment';

export async function load() {
    if (!browser) return;

    const { default: db } = await import('$lib/db');

    const playlists = await Promise.all(
        (
            await db.playlists.orderBy('name').toArray()
        ).map(async (playlist) => await db.friendlyPlaylist(playlist))
    );

    return {
        playlists
    };
}
