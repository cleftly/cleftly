import { get } from 'svelte/store';
import type { BackendClass } from './index';
import { player } from '$lib/stores';

export default class WebBackend implements BackendClass {
    public async init() {}

    public async playTrack() {}

    public async play() {
        get(player).webAudioElement?.play();
    }

    public async pause() {
        get(player).webAudioElement?.pause();
    }

    public async getTime() {
        return (get(player).webAudioElement as HTMLMediaElement).currentTime;
    }

    public async getDuration() {
        return (get(player).webAudioElement as HTMLMediaElement).duration;
    }

    public async seek(time: number) {
        (get(player).webAudioElement as HTMLMediaElement).currentTime = time;
    }

    public async getVolume() {
        return (get(player).webAudioElement as HTMLMediaElement).volume;
    }

    public async setVolume(volume: number) {
        (get(player).webAudioElement as HTMLMediaElement).volume = volume;
    }
}
