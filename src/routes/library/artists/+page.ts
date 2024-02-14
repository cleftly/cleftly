export async function load() {
    const { default: db } = await import('$lib/db');

    const artists = await db.artists.orderBy('name').toArray();

    return {
        artists
    };
}
