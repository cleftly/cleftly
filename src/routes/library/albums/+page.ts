import db from '$lib/db';

export async function load() {
    const albums = await Promise.all(
        (
            await db.albums.orderBy('name').toArray()
        ).map(async (album) => await db.friendlyAlbum(album))
    );

    return {
        albums
    };
}
