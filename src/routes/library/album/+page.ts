import { error } from '@sveltejs/kit';

import db, { type Album } from '$lib/db';

export async function load({ url }) {
    const slug = url.searchParams.get('id');

    if (!slug) {
        throw error(404, 'Album not found');
    }

    const res = await db.albums.get(slug);

    if (!slug) {
        throw error(404, 'Album not found');
    }

    const tracks = (
        await Promise.all(
            (
                await db.tracks.where('albumId').equals(slug).toArray()
            ).map(async (track) => await db.friendlyTrack(track))
        )
    ).sort((a, b) => a.trackNum - b.trackNum);

    const album = await db.friendlyAlbum(res as Album);

    return {
        tracks,
        album
    };
}
