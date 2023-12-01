/* eslint-disable @typescript-eslint/no-explicit-any */
export default class Test1 {
    public id: string = 'com.cleftly.test1'; // Must be unique
    public name: string = 'Test Plugin';
    public author: string = 'Cleftly'; // Anything you please, as long as it's true
    public description: string = "Do plugins work? Let's see"; // A short description
    public version: string = '1.0.0';
    public api_version: string = 'v1'; // Must be v1
    public subscribed_to: string[] = []; // Subscribe to events: ["on_play", "on_pause", "on_unload", "on_track_change"]

    private _apis;

    public async onEvent(event: string, data: any) {
        switch (event) {
            case 'on_track_change':
                console.log('on_track_change', data);
                break;

            case 'unload':
                console.log('Unloading plugin');
                break;

            default:
                break;
        }
    }

    constructor(apis) {
        this._apis = apis;

        // this._apis.stores.audio.subscribe(
        //     async (value: { track: FriendlyTrack } | null) => {
        //         console.log('on_track_change', value?.track);
        //     }
        // );
    }
}
