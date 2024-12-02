import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { FriendlyPlaylist } from './db';
import db from './db';
import { getAlbumId, getOrCreateArtist, idify } from './library';

export type PlaylistExport = {
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
    tracks: {
        id?: string;
        title: string;
        artist: string;
        album: string;
    }[];
};

// Playlist export/import utilities
export function exportPlaylist(playlist: FriendlyPlaylist) {
    return {
        name: playlist.name,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        tracks: playlist.tracks.map((t) => {
            return {
                id: t.id,
                title: t.title,
                artist: t.artist.name,
                album: t.album.name
            };
        })
    };
}

export async function importPlaylist(playlist: PlaylistExport) {
    const trackIds: string[] = [];

    for (const track of playlist.tracks) {
        if (track.id) {
            trackIds.push(track.id);
            continue;
        }

        const artistId = await getOrCreateArtist(track.artist);

        const albumId = await getAlbumId({
            name: track.album,
            artistId
        });

        trackIds.push(await idify(`${track.title}-${artistId}-${albumId}`));
    }

    await db.playlists.add({
        id: crypto.randomUUID(),
        name: playlist.name,
        trackIds,
        createdAt: playlist.createdAt || new Date(),
        updatedAt: playlist.updatedAt || new Date()
    });
}

export async function selectAndImportPlaylist() {
    const loc = (await open({
        title: 'Import playlist',
        filters: [
            {
                name: 'Playlists',
                extensions: ['json']
            }
        ]
    })) as string | null;

    if (!loc) return;

    const txt = await readTextFile(loc);

    const playlist = JSON.parse(txt) as unknown as PlaylistExport;

    await importPlaylist(playlist);

    return loc;
}

export async function selectAndImportPlaylists() {
    const loc = (await open({
        title: 'Import playlists',
        filters: [
            {
                name: 'Playlists',
                extensions: ['json']
            }
        ]
    })) as string | null;

    if (!loc) return;

    const txt = await readTextFile(loc);

    const playlists = JSON.parse(txt) as unknown as PlaylistExport[];

    for (const playlist of playlists) {
        await importPlaylist(playlist);
    }

    return loc;
}

export async function exportAndSavePlaylist(playlist: FriendlyPlaylist) {
    const txt = exportPlaylist(playlist);

    const loc = await save({
        title: 'Export playlist',
        defaultPath: `${playlist.name}.json`
    });

    if (!loc) return null;

    await writeTextFile(loc, JSON.stringify(txt, null, 2));

    return loc;
}

export async function exportAndSaveAllPlaylists() {
    const playlists = await Promise.all(
        (
            await db.playlists.orderBy('name').toArray()
        ).map(
            async (playlist) =>
                (await db.friendlyPlaylist(playlist)) as FriendlyPlaylist
        )
    );

    const exports: unknown[] = [];

    for (const playlist of playlists) {
        exports.push(exportPlaylist(playlist));
    }

    const loc = await save({
        title: 'Export playlists',
        defaultPath: 'playlists.json'
    });

    if (!loc) return null;

    await writeTextFile(loc, JSON.stringify(exports, null, 2));

    return loc;
}
