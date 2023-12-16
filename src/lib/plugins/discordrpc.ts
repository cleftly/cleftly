/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { invoke } from '@tauri-apps/api';
import { getClient } from '@tauri-apps/api/http';
import type { FriendlyTrack } from '$lib/db';
import { eventManager } from '$lib/events';
import { getOrCreateConfig, saveConfig } from '$lib/config';

type TrackData = {
    albumArtUrl: string | null;
    songLinkUrl: string | null;
};

interface DiscordRPCConfig {
    discordRpcDetails: string;
    discordRpcState: string;
    discordRpcShowElapsed: boolean;
    discordRpcLargeText: string;
    discordRpcSmallText: string;
    discordRpcExternal: boolean;
    discordRpcButtons: boolean;
}

export default class DiscordRPC {
    public readonly id: string = 'com.cleftly.discordrpc'; // Must be unique
    public readonly name: string = 'Discord Rich Presence';
    public readonly author: string = 'Cleftly'; // Anything you please, as long as it's true
    public readonly description: string =
        'Let your friends know what you are listening to'; // A short description
    public readonly version: string = '1.0.0';
    public readonly api_version: string = 'v1'; // Must be v1

    public readonly config_settings = {
        discordRpcDetails: { name: 'details', description: '', type: 'string' },
        discordRpcState: { name: 'state', description: '', type: 'string' },
        discordRpcShowElapsed: {
            name: 'Show elapsed time',
            description: '',
            type: 'boolean'
        },
        discordRpcLargeText: {
            name: 'Large Image Text',
            description: '',
            type: 'string'
        },
        discordRpcExternal: {
            name: 'Fetch external info',
            description:
                'Allows the plugin to fetch external track information, useful for things such as iTunes links :P',
            type: 'bool'
        },
        discordRpcButtons: {
            name: 'Show Buttons',
            description:
                'Show the song.link button allowing people to see where to listen to the song',
            type: 'bool'
        }
    };

    private _apis;
    private cache: Map<string, TrackData> = new Map();
    private eventDestroyers: (() => void)[] = [];

    public constructor(apis) {
        this._apis = apis;
        this.init().then(() => {
            this.setupEventListeners();
        });
    }

    public onDestroy() {
        for (const eventDestroyer of this.eventDestroyers) {
            eventDestroyer();
        }
    }

    private async init() {
        const conf = await getOrCreateConfig();
        const updatedConf = {
            discordRpcDetails: conf.discordRpcDetails ?? '{track}',
            discordRpcState: conf.discordRpcState ?? '{album} - {artist}',
            discordRpcShowElapsed: conf.discordRpcStart ?? true,
            discordRpcLargeText: conf.discordRpcLargeText ?? '{album}',
            discordRpcSmallText: conf.discordRpcSmallText ?? '',
            discordRpcExternal: conf.discordRpcExternal ?? true,
            discordRpcButtons: conf.discordRpcButtons ?? true
        };

        if (JSON.stringify(conf) !== JSON.stringify(updatedConf)) {
            await saveConfig({
                ...conf,
                ...updatedConf
            });
        }
    }

    private setupEventListeners() {
        this.eventDestroyers.push(
            eventManager.onEvent('on_track_change', this.handleTrackChange)
        );
    }

    private handleTrackChange = async (audio: {
        track: FriendlyTrack;
        currentTime: number;
    }) => {
        const conf = await getOrCreateConfig();
        const externalInfo = await this.getExternalInfo(audio.track, conf);

        const vars = {
            track: audio.track.title,
            album: audio.track.album.name,
            artist: audio.track.artist.name,
            albumArtUrl: externalInfo.albumArtUrl ?? '',
            songLinkUrl: externalInfo.songLinkUrl ?? '',
            duration: `${audio.track.duration}`
        };

        await this.setDiscordActivity(conf, audio, externalInfo, vars);
    };

    private async getExternalInfo(
        track: FriendlyTrack,
        conf: DiscordRPCConfig
    ): Promise<TrackData> {
        let externalInfo: TrackData = {
            albumArtUrl: null,
            songLinkUrl: null
        };

        if (this.cache.has(track.id)) {
            externalInfo = this.cache.get(track.id)!;
        } else if (conf.discordRpcExternal) {
            await invoke('clear_activity');
            const res = await (
                await getClient()
            ).get(`https://itunes.apple.com/search`, {
                query: {
                    term: `${track.title} ${track.artist.name} ${track.album.name}`,
                    entity: 'musicTrack',
                    limit: '5'
                }
            });

            if (res.status !== 200) {
                console.error(
                    `DiscordRPC: Failed to fetch external info: ${res.status}`
                );
            }

            const data = res.data as any;

            if (data.resultCount) {
                let result = data.results[0];

                for (const res of data.results) {
                    if (
                        res.artistName.toLowerCase() ===
                            track.artist.name.toLowerCase() &&
                        res.collectionName.toLowerCase() ===
                            track.album.name.toLowerCase() &&
                        res.trackName.toLowerCase() ===
                            track.title.toLowerCase()
                    ) {
                        result = res;
                        break;
                    }
                }

                externalInfo = {
                    albumArtUrl: result.artworkUrl100.replace(
                        /100x100bb/,
                        '512x512bb'
                    ),
                    songLinkUrl: `https://song.link/i/${result.trackId}`
                };
            }

            this.cache.set(track.id, externalInfo);
        }

        return externalInfo;
    }

    private async setDiscordActivity(
        conf: DiscordRPCConfig,
        audio: { track: FriendlyTrack; currentTime: number },
        externalInfo: TrackData,
        vars: { [key: string]: string }
    ) {
        await invoke('set_activity', {
            activity: {
                details: this.substring(
                    this.applyTemplate(conf.discordRpcDetails as string, vars),
                    80
                ),
                state: this.substring(
                    this.applyTemplate(conf.discordRpcState as string, vars),
                    80
                ),
                large_image: externalInfo.albumArtUrl || undefined,
                large_text: conf.discordRpcLargeText
                    ? this.applyTemplate(
                          conf.discordRpcLargeText as string,
                          vars
                      )
                    : undefined,
                small_text: conf.discordRpcSmallText
                    ? this.applyTemplate(
                          conf.discordRpcSmallText as string,
                          vars
                      )
                    : undefined,
                start: conf.discordRpcShowElapsed
                    ? Math.round(
                          new Date().getTime() / 1000 - audio.currentTime
                      )
                    : undefined,
                buttons:
                    conf.discordRpcButtons && externalInfo.songLinkUrl
                        ? [{ label: 'Listen', url: externalInfo.songLinkUrl }]
                        : undefined
            }
        }).then(() => {
            console.log(
                `DiscordRPC: Set activity: ${audio.track.title} - ${audio.track.artist.name} - ${audio.track.album.name}`
            );
        });
    }

    private substring(str: string, length: number): string {
        return str.length > length ? str.substring(0, length - 3) + '...' : str;
    }

    private applyTemplate(
        str: string,
        vars: { [key: string]: string }
    ): string {
        Object.keys(vars).forEach((key) => {
            str = str.replace(`{${key}}`, vars[key]);
        });
        return str;
    }
}
