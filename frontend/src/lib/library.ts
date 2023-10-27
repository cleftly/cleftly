/* Access and management of user library (Music directories, playlists, etc.) */

import * as mm from 'music-metadata-browser';
import {
    GetOrCreateCacheDir,
    GetOrCreateConfig,
    SplitPath,
    WalkDir
} from './wailsjs/go/main/App';
import { parseMMMetadata } from './player';
import db, { type FriendlyTrack } from './db';
import { supportedExtensions } from './utils';

export async function getOrCreateArtist(name: string) {
    const artists = await db.artists.where('name').equals(name).toArray();

    if (artists.length > 0) {
        return artists[0].id;
    }

    const id = crypto.randomUUID();

    await db.artists.add({
        id,
        name,
        genres: []
    });

    return id;
}

export async function getOrCreateAlbum({
    id,
    name,
    artistId,
    genres,
    totalTracks,
    albumArt
}: {
    id: string;
    name: string;
    artistId: string;
    genres: string[];
    totalTracks: number;
    albumArt?: string;
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
        albumArt
    });

    return id;
}

export async function saveArt(id: string, art: Blob | null) {
    if (!art) return;

    const path = `${await GetOrCreateCacheDir()}/${id}.png`;

    await fetch(`/localroot/${path}`, {
        method: 'POST',
        body: new Uint8Array(await art.arrayBuffer())
    });

    return `/localroot/${path}`;
}

export async function updateLibrary() {
    const config = await GetOrCreateConfig();

    if (!config.music_directories || config.music_directories?.length < 1) {
        return;
    }

    const library = await db.tracks.toArray();

    const files = (
        await Promise.all(
            config.music_directories.map((dir) => {
                return WalkDir(dir);
            })
        )
    )
        .flat()
        .filter((file) => {
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
                await mm.fetchFromUrl(`/localroot/${file}`)
            );
        } catch (e) {
            metadata = {
                title: (await SplitPath(file)).slice(-1)[0],
                artist: 'Unknown Artist',
                album: (await SplitPath(file)).reverse()[1],
                albumArt: null,
                genres: [],
                duration: 0,
                trackNum: 1,
                totalTracks: 1,
                type: 'local',
                location: file
            };
        }

        const artistId = await getOrCreateArtist(metadata.artist);

        const id = crypto.randomUUID();
        const data = {
            id,
            title: metadata.title || (await SplitPath(file)).slice(-1)[0],
            artistId,
            albumId: metadata.album
                ? await getOrCreateAlbum({
                      id: `${metadata.album}-${artistId}-${metadata.totalTracks}`,
                      name: metadata.album,
                      artistId,
                      genres: [],
                      totalTracks: metadata.totalTracks,
                      albumArt: metadata.albumArt
                          ? await saveArt(
                                `${metadata.album}-${artistId}-${metadata.totalTracks}`,
                                metadata.albumArt
                            )
                          : null
                  })
                : '',
            albumArt: '',
            genres: metadata.genres,
            type: 'local',
            location: file,
            duration: metadata.duration,
            trackNum: metadata.trackNum,
            totalTracks: metadata.totalTracks
        };

        res.push(data);
    }

    await db.tracks.bulkPut(res);
}

export async function getLibrary(): Promise<FriendlyTrack[]> {
    await updateLibrary();

    return await Promise.all(
        (
            await db.tracks.toArray()
        ).map(async (t) => {
            return await db.friendlyTrack(t);
        })
    );
}
