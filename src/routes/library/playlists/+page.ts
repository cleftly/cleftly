import { browser } from '$app/environment';
import type { FriendlyPlaylist } from '$lib/db';

export async function load() {
    if (!browser) return;

    const { default: db } = await import('$lib/db');

    const playlists = await Promise.all(
        (
            await db.playlists.orderBy('name').toArray()
        ).map(
            async (playlist) =>
                (await db.friendlyPlaylist(playlist)) as FriendlyPlaylist
        )
    );

    return {
        playlists
    };
}
