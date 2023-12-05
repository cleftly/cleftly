import { browser } from '$app/environment';

export async function load() {
    if (!browser) return;

    const { default: db } = await import('$lib/db');

    const tracks = await Promise.all(
        (
            await db.tracks.orderBy('title').toArray()
        ).map(async (track) => await db.friendlyTrack(track))
    );

    return {
        tracks
    };
}
