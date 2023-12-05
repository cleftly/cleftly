import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { Playlist } from '$lib/db';

export async function load({ url }) {
    if (!browser) return;

    const { default: db } = await import('$lib/db');

    const slug = url.searchParams.get('id');

    if (!slug) {
        throw error(404, 'Playlist not found');
    }

    const res = await db.playlists.get(slug);

    if (!res) {
        throw error(404, 'Playlist not found');
    }

    const playlist = await db.friendlyPlaylist(res as Playlist);

    return {
        playlist
    };
}
