import { writable } from 'svelte/store';

import type { FriendlyTrack, Playlist } from './db';
import { scrobble } from './integrations/lastfm';
import type { Plugin } from './plugins';

export type Lyrics = {
    format: 'lrc' | 'plain' | 'richsync';
    lyrics: string;
    credits: string; // aka the credits
};

type Audio = {
    id: string;
    track: FriendlyTrack;
    src: string;
    currentTime: number;
    duration: number;
    scrobbled: boolean; // For .fm scrobbling
    playedAt: Date;
    lyrics: Lyrics | null;
    backend: 'native' | 'web';
};

type Player = {
    muted: boolean;
    volume: number;
    paused: boolean;
    repeat: false | 'one' | 'all';
    speed: number;
    webAudioElement: HTMLMediaElement | null;
};

type Queue = {
    tracks: FriendlyTrack[];
    unshuffled: FriendlyTrack[] | null;
    index: number;
};

type Task = {
    id: string;
    title: string;
    message?: string;
};

type ProgressItem = {
    title: string;
    message?: string;
    progress?: number; // number between 0 and 1
};

type Front = {
    modal: 'lyrics' | 'queue' | 'playerSettings' | null;
    theme: string;
    color: 'light' | 'dark' | 'oled';
};

export const INITIAL_AUDIO = {
    id: '',
    currentTime: 0,
    duration: 0,
    scrobbled: false,
    lyrics: null,
    backend: 'web' as const
};

export const audio = writable<Audio | null>(null);

export const player = writable<Player>({
    muted: false,
    volume: 1,
    paused: false,
    repeat: 'all',
    speed: 1,
    webAudioElement: null
});

export const queue = writable<Queue>({
    tracks: [],
    unshuffled: null,
    index: 0
});

export const tasks = writable<Task[]>([]);

export const playlists = writable<Playlist[]>([]);

export const progress = writable<Map<string, ProgressItem>>(new Map());

export const plugins = writable<Map<string, Plugin>>(new Map());

export const front = writable<Front>({
    modal: null,
    theme: 'crimson',
    color: 'dark'
});

audio.subscribe((a) => {
    if (!a) return;

    if (a.track.duration < 30 || a.scrobbled || a.duration < 1) return;

    if (a.currentTime >= a.duration / 2) {
        a.scrobbled = true;

        scrobble(a.track, a.playedAt)
            .then((res) => {
                if (res) {
                    console.info('Last.FM: Scrobbled track', res.data);
                }
            })
            .catch((e) => {
                console.error(e);
                console.error('Last.FM: Failed to scrobble track');
            });
    }
});
