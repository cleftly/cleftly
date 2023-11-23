import db from '$lib/db';

export async function load() {
    const playlists = await Promise.all(
        (
            await db.playlists.orderBy('name').toArray()
        ).map(async (playlist) => await db.friendlyPlaylist(playlist))
    );

    return {
        playlists
    };
}
