import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';

export async function load({ url }) {
    if (!browser) return;

    const { default: db } = await import('$lib/db');

    const slug = url.searchParams.get('id');

    if (!slug) {
        error(404, 'Artist not found');
    }

    const artist = await db.artists.get(slug);

    const albums = await Promise.all(
        (
            await db.albums.where('artistId').equals(slug).toArray()
        ).map(async (album) => await db.friendlyAlbum(album))
    );

    const tracks = await Promise.all(
        (
            await db.tracks.where('artistId').equals(slug).toArray()
        ).map(async (track) => await db.friendlyTrack(track))
    );

    if (!artist) {
        error(404, 'Artist not found');
    }

    return {
        artist,
        albums,
        tracks
    };
}
