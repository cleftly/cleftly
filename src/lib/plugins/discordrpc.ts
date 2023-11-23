import { invoke } from '@tauri-apps/api';
import type { audio } from '../stores';
import type { FriendlyTrack } from '$lib/db';

export default class DiscordRPC {
    public name: string = 'Discord Rich Presence';
    public description: string =
        'Let your friends know what you are listening to';
    public version: string = '1.0.0';
    public author: string = 'cleftly';

    private _apis: {
        stores: {
            audio: typeof audio;
        };
    };

    constructor(apis: typeof this._apis) {
        this._apis = apis;

        this._apis.stores.audio.subscribe(
            (value: { track: FriendlyTrack } | null) => {
                // if (value) {
                //     invoke('set_activity', {
                //         activity: {
                //             title: value.track.title,
                //             artist: value.track.title,
                //             album: value.track.title
                //         }
                //     });
                // } else {
                //     invoke('clear_activity');
                // }
            }
        );
    }
}
