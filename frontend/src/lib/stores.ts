import { writable } from 'svelte/store';
import type { FriendlyTrack } from './db';

type Audio = {
    id: string;
    track: FriendlyTrack;
    src: string;
    currentTime: number;
    duration: number;
};

type Player = {
    muted: boolean;
    volume: number;
    paused: boolean;
    repeat: false | 'one' | 'all';
};

type Queue = {
    tracks: FriendlyTrack[];
    index: number;
};

type Task = {
    id: string;
    title: string;
    message?: string;
};

export const INITIAL_AUDIO = {
    id: '',
    metadata: {
        title: '',
        artist: '',
        album: '',
        albumArt: ''
    },
    paused: false,
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: 0
};

export const audio = writable<Audio | null>(null);

export const player = writable<Player>({
    muted: false,
    volume: 1,
    paused: false,
    repeat: false
});

export const queue = writable<Queue>({
    tracks: [],
    index: 0
});

export const tasks = writable<Task[]>([]);
