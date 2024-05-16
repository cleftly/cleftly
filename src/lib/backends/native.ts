import { invoke } from '@tauri-apps/api';
import type { BackendClass } from './index';
import type { FriendlyTrack } from '$lib/db';

export default class NativeBackend implements BackendClass {
    public async init() {}

    public async playTrack(track: FriendlyTrack) {
        await invoke('audio_play_track', {
            filePath: track.location
        });
    }

    public async play() {
        await invoke('audio_play');
    }

    public async pause() {
        await invoke('audio_pause');
    }

    public async getTime() {
        return (await invoke('audio_current_time')) as number;
    }

    public async getDuration() {
        return (await invoke('audio_duration')) as number;
    }

    public async seek(time: number) {
        await invoke('audio_seek', {
            time
        });
    }

    public async getVolume() {
        return (await invoke('audio_volume')) as number;
    }

    public async setVolume(volume: number) {
        await invoke('audio_set_volume', {
            volume
        });
    }
}
