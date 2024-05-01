import type { PluginAPI } from '$lib/api/generate';

export default class LastFmPlugin {
    public static id: string = 'com.cleftly.lastfm'; // Must be unique
    public static name: string = 'Last.fm';
    public static author: string = 'Cleftly'; // Anything you please, as long as it's true
    public static description: string = 'Scrobble tracks to Last.fm'; // A short description
    public static version: string = '1.0.0';
    public static api_version: string = 'v1'; // Must be v1
    public static featnote: string[] = ['network'];

    private api: PluginAPI;
    private eventDestroyers: (() => void)[] = [];

    public constructor(api: PluginAPI) {
        this.api = api;
        this.init().then(() => {
            this.setupEventListeners();
        });
    }

    private setupEventListeners() {
        // this.eventDestroyers.push(
        //     this.api.events.eventManager.onEvent(
        //         'onLyricsRequested',
        //         async (track: FriendlyTrack) => {
        //             // TODO: Respect config option
        //             await this.api.events.eventManager.fireEvent(
        //                 'onLyricsLoaded',
        //                 await getLyrics(track, true, true)
        //             );
        //         }
        //     )
        // );
    }

    private async init() {}
}
