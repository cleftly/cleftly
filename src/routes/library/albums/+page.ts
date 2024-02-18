import { browser } from '$app/environment';

export async function load() {
    if (!browser) return;

    const { default: db } = await import('$lib/db');

    const albums = await Promise.all(
        (
            await db.albums.orderBy('name').toArray()
        ).map(async (album) => await db.friendlyAlbum(album))
    );

    return {
        albums
    };
}
