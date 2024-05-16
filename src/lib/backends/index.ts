import type { FriendlyTrack } from '$lib/db';

export type BackendClass = {
    init: () => Promise<void>;
    playTrack: (track: FriendlyTrack) => Promise<void>;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    getTime: () => Promise<number>;
    getDuration: () => Promise<number>;
    seek: (time: number) => Promise<void>;
    getVolume: () => Promise<number>;
    setVolume: (volume: number) => Promise<void>;
};
