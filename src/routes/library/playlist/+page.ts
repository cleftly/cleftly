import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import type { FriendlyPlaylist, Playlist } from '$lib/db';

export const load: PageLoad = async ({ url }) => {
    if (!browser) return;

    const { default: db } = await import('$lib/db');

    const slug = url.searchParams.get('id');

    if (!slug) {
        error(404, 'Playlist not found');
    }

    const res = await db.playlists.get(slug);

    if (!res) {
        error(404, 'Playlist not found');
    }

    const playlist = (await db.friendlyPlaylist(
        res as Playlist
    )) as FriendlyPlaylist;

    return {
        playlist
    };
};
