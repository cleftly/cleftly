export default class DiscordRPC {
    public id: string = 'com.cleftly.discordrpc'; // Must be unique
    public name: string = 'Discord Rich Presence';
    public author: string = 'Cleftly'; // Anything you please, as long as it's true
    public description: string =
        'Let your friends know what you are listening to'; // A short description
    public version: string = '1.0.0';
    public api_version: string = 'v1'; // Must be v1
    public subscribed_to: string[] = []; // Subscribe to events: ["on_play", "on_pause", "on_unload", "on_track_change"]

    private _apis;

    constructor(apis) {
        this._apis = apis;

        this._apis.stores.audio.subscribe(async (value: { track } | null) => {
            if (value) {
                // @ts-ignore -- TODO
                await window.__TAURI_INVOKE__('set_activity', {
                    activity: {
                        title: value.track.title,
                        artist: value.track.title,
                        album: value.track.title
                    }
                });
            } else {
                // @ts-ignore -- TODO
                await window.__TAURI_INVOKE__('clear_activity');
            }
        });
    }
}
