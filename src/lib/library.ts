/* 
Access and management of user library (Music directories, playlists, etc.)
*/
import { BaseDirectory, writeBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { get } from 'svelte/store';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api';
import { md5 } from 'js-md5';
import db, {
    type Artist,
    type Album,
    type Track,
    type FriendlyTrack
} from './db';
import { getOrCreateCacheDir, getOrCreateConfig } from './config';
import { playlists, progress } from './stores';
import { eventManager } from '$lib/events';

export async function idify(str: string) {
    const stripped = str
        .toLocaleLowerCase()
        .trim()
        .replace(/[^a-zA-Z0-9]/g, ''); // TODO: i18n

    return md5.create().update(stripped).hex();
}

export async function getOrCreateArtist(name: string) {
    const id = await idify(name);

    if (!(await db.artists.get(id))) {
        await db.artists.add({
            id,
            name,
            genres: [],
            createdAt: new Date()
        });
    }

    return id;
}

export async function getAlbumId({
    name,
    artistId
}: {
    name: string;
    artistId: string;
}) {
    return await idify(`${name}-${artistId}`);
}

export async function getOrCreateAlbum({
    id,
    name,
    artistId,
    genres,
    albumArt,
    year
}: {
    id: string;
    name: string;
    artistId: string;
    genres: string[];
    albumArt?: string;
    year?: number;
}): Promise<string> {
    const res = await db.albums.get(id);

    if (res) {
        return res.id;
    }

    await db.albums.add({
        id,
        name,
        genres,
        artistId,
        albumArt,
        createdAt: new Date(),
        year
    });

    return id;
}

export async function saveArt(id: string, art: Blob | null) {
    if (!art) return;

    await getOrCreateCacheDir();

    await writeBinaryFile(
        `${id}.jpg`,
        new Uint8Array(await art.arrayBuffer()),
        {
            dir: BaseDirectory.AppCache
        }
    );

    return convertFileSrc(
        await join(await getOrCreateCacheDir(), `${id}.jpg`),
        'stream'
    );
}

export async function updateLibrary() {
    progress.set(
        get(progress).set('updateLibrary', {
            title: 'Updating library',
            progress: 0
        })
    );

    const config = await getOrCreateConfig();

    if (!config.music_directories || config.music_directories?.length < 1) {
        return;
    }

    // Call the Rust update_library function
    await invoke('update_library', {
        musicDirectories: config.music_directories,
        library: {
            tracks: await db.tracks.toArray(),
            artists: await db.artists.toArray(),
            albums: await db.albums.toArray()
        }
    })
        .then((newLibrary: unknown) => {
            const library = newLibrary as {
                tracks: Track[];
                artists: Artist[];
                albums: Album[];
            };

            // Convert album art locations into stream URLs
            library.albums.forEach((t) => {
                // TODO: Proper solution for this
                if (t.albumArt) {
                    if (
                        !['stream://', 'http://', 'https://'].some((prefix) =>
                            t.albumArt?.startsWith(prefix)
                        )
                    ) {
                        t.albumArt = convertFileSrc(t.albumArt, 'stream');
                    }
                }

                if (t.animatedAlbumArt) {
                    if (
                        !['stream://', 'http://', 'https://'].some((prefix) =>
                            t.animatedAlbumArt?.startsWith(prefix)
                        )
                    ) {
                        t.animatedAlbumArt = convertFileSrc(
                            t.animatedAlbumArt,
                            'stream'
                        );
                    }
                }
            });

            db.transaction('rw', db.tracks, db.artists, db.albums, async () => {
                await db.tracks.clear();
                await db.artists.clear();
                await db.albums.clear();
                await db.tracks.bulkAdd(library.tracks);
                await db.artists.bulkAdd(library.artists);
                await db.albums.bulkAdd(library.albums);
            });

            eventManager
                .fireEvent('onLibraryUpdate', library)
                .then(() => {})
                .catch((err) => {
                    console.error(err);
                    console.error('Failed to fire event onLibraryUpdate');
                });
        })
        .catch((e) => {
            console.error(e);
            throw e; // Re-throw the error to stop execution
        });

    progress.set(
        get(progress).set('updateLibrary', {
            title: 'Updating library',
            progress: 1
        })
    );
}

export async function getLibrary(): Promise<FriendlyTrack[]> {
    await updateLibrary();

    console;
    return await Promise.all(
        (
            await db.tracks.toArray()
        ).map(async (t) => {
            return await db.friendlyTrack(t);
        })
    );
}

export async function friendlyLibrary(
    library: Track[]
): Promise<FriendlyTrack[]> {
    return await Promise.all(
        library.map(async (t) => {
            return await db.friendlyTrack(t);
        })
    );
}

export async function toggleFavorite(trackId: string) {
    const FAVORITES_PLAYLIST = '0000-0000-0000-0001';

    const playlist = await db.playlists.get(FAVORITES_PLAYLIST);

    if (!playlist) {
        return;
    }

    if (playlist.trackIds.includes(trackId)) {
        await db.playlists.update(FAVORITES_PLAYLIST, {
            trackIds: playlist.trackIds.filter((id) => id !== trackId)
        });
    } else {
        await db.playlists.update(FAVORITES_PLAYLIST, {
            trackIds: [...playlist.trackIds, trackId]
        });
    }

    const updatedPlaylist = await db.playlists.get(FAVORITES_PLAYLIST);

    if (updatedPlaylist) {
        console.log('Updated', updatedPlaylist);
        playlists.set([
            ...get(playlists).filter((p) => p.id !== FAVORITES_PLAYLIST),
            updatedPlaylist
        ]);
    }
}
