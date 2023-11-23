import db from '$lib/db';

export async function load() {
    const tracks = await Promise.all(
        (
            await db.tracks.orderBy('title').toArray()
        ).map(async (track) => await db.friendlyTrack(track))
    );

    return {
        tracks
    };
}
