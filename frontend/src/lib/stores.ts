import { writable } from 'svelte/store';

type Metadata = {
    title: string;
    artist: string;
    album: string;
    albumArt: string;
};

type Audio = {
    id: string;
    metadata?: Metadata;
    src: string;
    paused: boolean;
    volume: number;
    muted: boolean;
    currentTime: number;
    duration: number;
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
