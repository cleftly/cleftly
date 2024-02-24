import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import type { Album } from '$lib/db';

export const load: PageLoad = async ({ url }) => {
    if (!browser) return;

    const slug = url.searchParams.get('id');

    if (!slug) {
        error(404, 'Album not found');
    }

    const { default: db } = await import('$lib/db');

    const res = await db.albums.get(slug);

    if (!slug) {
        error(404, 'Album not found');
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
};
