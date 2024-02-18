import { browser } from '$app/environment';

export async function load() {
    if (!browser) return;

    const { default: db } = await import('$lib/db');

    const artists = await db.artists.orderBy('name').toArray();

    return {
        artists
    };
}
