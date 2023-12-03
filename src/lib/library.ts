/* 
Access and management of user library (Music directories, playlists, etc.)
*/
import * as mm from 'music-metadata-browser';
import { BaseDirectory, writeBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
const { join } = await import('@tauri-apps/api/path');
import { get } from 'svelte/store';
import db, { type FriendlyTrack, type Track } from './db';
import { parseMMMetadata } from './player';
import { getStreamUrl, removeExtension, supportedExtensions } from './utils';
import {
    getOrCreateCacheDir,
    getOrCreateConfig,
    splitPath,
    walkDir
} from './config';
import { progress } from './stores';

export async function idify(str: string) {
    const stripped = str
        .toLocaleLowerCase()
        .trim()
        .replace(/[^a-zA-Z0-9]/g, ''); // TODO: i18n

    return btoa(stripped);
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

    const library = await db.tracks.toArray();

    const files = (
        await Promise.all(
            config.music_directories.map(async (dir: string) => {
                return await walkDir(dir);
            })
        )
    )
        .flat()
        .filter((file: string) => {
            return (
                supportedExtensions.includes(
                    file.split('.').slice(-1)[0].toLowerCase()
                ) && !library.some((item) => file === item.location)
            );
        });

    const res = [];

    for (const file of files) {
        let metadata;

        try {
            metadata = parseMMMetadata(
                await mm.fetchFromUrl(await getStreamUrl(file))
            );
        } catch (e) {
            console.error(e);
            metadata = null;
        }

        const title =
            metadata?.title ||
            removeExtension((await splitPath(file)).slice(-1)[0]);
        const album =
            metadata?.album ||
            (await splitPath(file)).reverse()[1] ||
            removeExtension((await splitPath(file)).reverse()[1]);
        const artist =
            metadata?.artist ||
            (await splitPath(file)).reverse()[2] ||
            'Unknown Artist';
        const totalTracks = metadata?.totalTracks || 1;
        const artistId = await getOrCreateArtist(artist);
        const albumId = await getAlbumId({
            name: album,
            artistId
        });
        const id = await idify(`${title}-${artistId}-${albumId}`);

        await getOrCreateAlbum({
            id: albumId,
            name: album,
            artistId,
            genres: metadata?.genres || [],
            albumArt: metadata?.albumArt
                ? await saveArt(albumId, metadata.albumArt as Blob)
                : undefined,
            year: metadata?.year
        });

        const data = {
            id,
            title,
            albumId,
            artistId,
            genres: metadata?.genres || [],
            type: 'local' as const,
            location: file,
            duration: metadata?.duration || 0,
            trackNum: metadata?.trackNum || 1,
            totalTracks,
            createdAt: new Date()
        };

        res.push(data);

        progress.set(
            get(progress).set('updateLibrary', {
                title: 'Updating library',
                progress: res.length / files.length
            })
        );
    }

    await db.tracks.bulkPut(res);
    console.timeEnd('Update library');

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
