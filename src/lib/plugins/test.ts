import type { FriendlyTrack } from '$lib/db';
import { eventManager } from '$lib/events';

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
    private eventDestroyers: ReturnType<typeof eventManager.onEvent>[] = [];

    public constructor(apis) {
        this._apis = apis;

        this.eventDestroyers.push(
            eventManager.onEvent(
                'on_track_change',
                async (track: FriendlyTrack) => {
                    console.log(`Played track: ${JSON.stringify(track)}`);
                }
            )
        );

        console.log('Loaded test');
    }

    public onDestroy() {
        for (const eventDestroyer of this.eventDestroyers) {
            eventDestroyer();
        }
    }
}
