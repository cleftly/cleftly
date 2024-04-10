/* 
Library dtabase Using Dexie.js (IndexedDB wrapper) 
friendlyThing functions the referenced objects in the database to make them easier to work with
*/
import Dexie, { type Table } from 'dexie';
import { get } from 'svelte/store';

import { playlists } from './stores';

export interface Track {
    id: string;
    location: string;
    type?: 'local' | 'http'; // TODO: For future use

    title: string;
    artistId: string;
    albumId: string;
    albumArt?: string;
    animatedAlbumArt?: string;
    genres: string[];

    duration: number;
    trackNum: number;
    totalTracks: number;
    discNum: number;
    totalDiscs: number;
    createdAt: Date;

    lastPlayedAt?: Date;
}

export interface Album {
    id: string;
    name: string;
    genres: string[];
    artistId: string;
    albumArt?: string;
    animatedAlbumArt?: string;
    createdAt: Date;
    year: number | undefined;
}

export interface Artist {
    id: string;
    name: string;
    genres: string[];
    createdAt: Date;
}

export interface Playlist {
    id: string;
    name: string;
    trackIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface KV {
    key: string;
    value: unknown;
}

export interface FriendlyTrack extends Track {
    artist: Artist;
    album: Album;
}

export interface FriendlyAlbum extends Album {
    artist: Artist;
    tracks: Track[];
}

export interface FriendlyPlaylist extends Playlist {
    tracks: FriendlyTrack[];
}

export interface FriendlyPlaylistForced extends Playlist {
    tracks: (FriendlyTrack | null)[];
}

export class Database extends Dexie {
    tracks!: Table<Track>;
    albums!: Table<Album>;
    artists!: Table<Artist>;
    playlists!: Table<Playlist>;
    kvs!: Table<KV>;

    constructor() {
        super('cleftly', { autoOpen: true });
        this.version(0.1).stores({
            tracks: 'id, title, artistId, albumId, albumArt, genres, duration, trackNum, totalTracks, type, createdAt, discNum, totalDiscs, lastPlayedAt',
            albums: 'id, name, genres, artistId, albumArt, createdAt, year',
            artists: 'id, name, genres, createdAt',
            playlists: 'id, name, tracks, createdAt, updatedAt',
            kvs: 'key, value'
        });
    }

    async friendlyTrack(track: Track): Promise<FriendlyTrack> {
        const artist = await this.artists.get(track.artistId);

        if (!artist) {
            throw new Error('Artist not found');
        }

        const album = await this.albums.get(track.albumId);

        if (!album) {
            throw new Error('Album not found');
        }

        return {
            ...track,
            artist,
            album
        };
    }

    async friendlyAlbum(album: Album): Promise<FriendlyAlbum> {
        const artist = await this.artists.get(album.artistId);
        const tracks = await this.tracks
            .where('albumId')
            .equals(album.id)
            .toArray();

        if (!artist) {
            throw new Error('Artist not found');
        }

        return {
            ...album,
            artist,
            tracks
        };
    }

    async friendlyPlaylist(
        playlist: Playlist,
        force: boolean = false
    ): Promise<FriendlyPlaylist | FriendlyPlaylistForced> {
        const tracks = await this.tracks
            .where('id')
            .anyOf(playlist.trackIds)
            .toArray();

        const friendlyTracks = [];

        for (const trackId of playlist.trackIds) {
            const track = tracks.find((t) => t.id === trackId);

            if (track) {
                const friendlyTrack = await this.friendlyTrack(track);
                friendlyTracks.push(friendlyTrack);
            } else {
                if (force) {
                    friendlyTracks.push(null);
                }
            }
        }

        if (force) {
            return {
                ...playlist,
                tracks: friendlyTracks
            } as FriendlyPlaylistForced;
        }

        return {
            ...playlist,
            tracks: friendlyTracks
        } as FriendlyPlaylist;
    }
}

const db = new Database();

db.use({
    stack: 'dbcore',
    name: 'updateStores',
    create(downlevelDatabase) {
        return {
            ...downlevelDatabase,
            table(tableName) {
                const downlevelTable = downlevelDatabase.table(tableName);
                return {
                    ...downlevelTable,
                    mutate: async (req) => {
                        return downlevelTable.mutate(req).then(async (res) => {
                            if (!['add', 'put', 'delete'].includes(req.type)) {
                                return res;
                            }

                            switch (downlevelTable.name) {
                                case 'playlists': {
                                    if (req.type === 'add') {
                                        playlists.set([
                                            ...(req.values || []),
                                            ...get(playlists)
                                        ]);
                                    } else if (req.type === 'put') {
                                        playlists.set([
                                            ...(req.values || []),
                                            ...get(playlists).filter(
                                                (p) =>
                                                    !req.values
                                                        .map(
                                                            (playlist) =>
                                                                playlist.id
                                                        )
                                                        .includes(p.id)
                                            )
                                        ]);
                                    } else if (req.type === 'delete') {
                                        playlists.set(
                                            get(playlists).filter(
                                                (p) =>
                                                    !res.results?.includes(p.id)
                                            )
                                        );
                                    }

                                    break;
                                }
                                default:
                                    break;
                            }

                            return res;
                        });
                    }
                };
            }
        };
    }
});
export default db;
