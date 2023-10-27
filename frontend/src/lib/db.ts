/* Database Using Dexie.js (IndexedDB wrapper) */
import Dexie, { type Table } from 'dexie';

export interface Track {
    id: string;
    location: string;
    type?: 'local' | 'http'; // TODO: For future use

    title: string;
    artistId: string;
    albumId: string;
    albumArt?: string;
    genres: string[];

    duration: number;
    trackNum: number;
    totalTracks: number;
}

export interface Album {
    id: string;
    name: string;
    genres: string[];
    artistId: string;
    albumArt?: string;
}

export interface Artist {
    id: string;
    name: string;
    genres: string[];
}

export interface Playlist {
    id: string;
    name: string;
    trackIds: string[];
}

export interface FriendlyTrack extends Track {
    artist: Artist;
    album: Album;
}

export interface FriendlyAlbum extends Album {
    artist: Artist;
}

export interface FriendlyPlaylist extends Playlist {
    tracks: FriendlyTrack[];
}

export class Database extends Dexie {
    tracks!: Table<Track>;
    albums!: Table<Album>;
    artists!: Table<Artist>;
    playlists!: Table<Playlist>;

    constructor() {
        super('pulseflow', { autoOpen: true });
        this.version(0.1).stores({
            tracks: 'id, title, artistId, albumId, albumArt, genres, duration, trackNum, totalTracks, type',
            albums: 'id, name, genres, artist, albumArt',
            artists: 'id, name, genres',
            playlists: 'id, name, tracks'
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

        if (!artist) {
            throw new Error('Artist not found');
        }

        return {
            ...album,
            artist
        };
    }

    async friendlyPlaylist(playlist: Playlist): Promise<FriendlyTrack[]> {
        const tracks = await this.tracks
            .where('id')
            .anyOf(playlist.trackIds)
            .toArray();

        // return await this.friendlyTracks(tracks);
        return await Promise.all(
            tracks.map((track) => {
                return this.friendlyTrack(track);
            })
        );
    }
}

export const db = new Database();

export default db;
