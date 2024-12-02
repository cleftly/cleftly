/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { invoke } from '@tauri-apps/api/core';
import { fetch } from '@tauri-apps/plugin-http';
import { get } from 'svelte/store';
import { getTimestamp } from '$lib/utils';
import type { FriendlyTrack } from '$lib/db';
import type { PluginAPI } from '$lib/api/generate';

type TrackData = {
    albumArtUrl: string | null;
    songLinkUrl: string | null;
};

interface DiscordRPCConfig {
    discordRpcDetails: string;
    discordRpcState: string;
    discordRpcShowElapsed: boolean;
    discordRpcLargeImage: string;
    discordRpcLargeText: string;
    discordRpcSmallText: string;
    discordRpcExternal: boolean;
    discordRpcButtons: boolean;
    discordRpcHideOnPause: boolean;
    discordRpcListeningType: boolean;
}

export default class DiscordRPC {
    public static id: string = 'com.cleftly.discordrpc'; // Must be unique
    public static name: string = 'Discord Rich Presence';
    public static author: string = 'Cleftly'; // Anything you please, as long as it's true
    public static description: string =
        'Let your friends know what you are listening to'; // A short description
    public static version: string = '1.0.0';
    public static api_version: string = 'v1'; // Must be v1
    public static featnote: string[] = ['network'];

    /*
             track: audio.track.title,
            album: audio.track.album.name,
            artist: audio.track.artist.name,
            albumArtUrl: externalInfo.albumArtUrl ?? '',
            songLinkUrl: externalInfo.songLinkUrl ?? '',
            duration: `${audio.duration || audio.track.duration}`
    */

    public static config_settings = {
        _1: {
            name: 'Variables',
            description:
                '{artist}, {album}, {track}, {albumArtUrl}, {songLinkUrl}, {duration}, {rawDuration}',
            type: 'hidden'
        },
        discordRpcDetails: {
            name: 'details',
            description: 'The first line of the Rich Presence.',
            type: 'string'
        },
        discordRpcState: {
            name: 'state',
            description: 'The second line of the Rich Presence.',
            type: 'string'
        },
        discordRpcShowElapsed: {
            name: 'Show elapsed time',
            description: '',
            type: 'bool'
        },
        discordRpcLargeImage: {
            name: 'Large Image',
            description: '',
            type: 'string'
        },
        discordRpcLargeText: {
            name: 'Large Image Text',
            description: 'Shown when hovering large image (cover art)',
            type: 'string'
        },
        discordRpcSmallText: {
            name: 'Small Image Text',
            description: '(Not currently in use)',
            type: 'string'
        },
        discordRpcExternal: {
            name: 'Fetch external info',
            description:
                'Allows the plugin to fetch external track information, enabling things such as song links, album art :P',
            type: 'bool'
        },
        discordRpcHideOnPause: {
            name: 'Hide on pause',
            description:
                'Hide the Discord Rich Presence when the player is paused',
            type: 'bool'
        },
        discordRpcButtons: {
            name: 'Show Buttons',
            description:
                'Show the song.link button allowing people to see where to listen to the song',
            type: 'bool'
        },
        discordRpcListeningType: {
            name: 'Listening Type',
            description: 'Show "Listening to" instead of "Playing"',
            type: 'bool'
        }
    };

    private api: PluginAPI;
    private cache: Map<string, TrackData> = new Map();
    private eventDestroyers: (() => void)[] = [];

    public constructor(api: PluginAPI) {
        this.api = api;
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
        try {
            await invoke('clear_activity');
        } catch (e) {
            console.error(e);
        }

        const conf = (await this.api.config.getConfig()) as DiscordRPCConfig;
        const updatedConf = {
            discordRpcDetails: conf.discordRpcDetails ?? '{track}',
            discordRpcState: conf.discordRpcState ?? '{album} - {artist}',
            discordRpcShowElapsed: conf.discordRpcShowElapsed ?? true,
            discordRpcLargeImage: conf.discordRpcLargeImage ?? '{albumArtUrl}',
            discordRpcLargeText: conf.discordRpcLargeText ?? '{album}',
            discordRpcSmallText: conf.discordRpcSmallText ?? '',
            discordRpcExternal: conf.discordRpcExternal ?? true,
            discordRpcButtons: conf.discordRpcButtons ?? true,
            discordRpcHideOnPause: conf.discordRpcHideOnPause ?? false,
            discordRpcListeningType: conf.discordRpcListeningType ?? true
        };

        if (JSON.stringify(conf) !== JSON.stringify(updatedConf)) {
            await this.api.config.saveConfig({
                ...conf,
                ...updatedConf
            });
        }
    }

    private setupEventListeners() {
        this.eventDestroyers.push(
            this.api.events.eventManager.onEvent(
                'onTrackChange',
                this.handleTrackChange
            )
        );
    }

    private handleTrackChange = async (
        audio: Parameters<typeof this.api.stores.audio.set>[0]
    ) => {
        if (!audio) return;

        const conf = (await this.api.config.getConfig()) as DiscordRPCConfig;
        const externalInfo = await this.getExternalInfo(audio.track, conf);

        const vars = {
            track: audio.track.title,
            album: audio.track.album.name,
            artist: audio.track.artist.name,
            albumArtUrl: externalInfo.albumArtUrl ?? '',
            songLinkUrl: externalInfo.songLinkUrl ?? '',
            duration: getTimestamp(audio.duration || audio.track.duration),
            rawDuration: `${audio.duration || audio.track.duration}`
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

            const normAlbumName = track.album.name
                .toLowerCase()
                .replace('(deluxe edition)', '')
                .replace('(deluxe)', '')
                .replace('(single)', '');

            const url = new URL('https://itunes.apple.com/search');

            url.searchParams.set(
                'term',
                `${track.title} ${track.artist.name} ${normAlbumName}`.replace(
                    /[@~`!@#$%^&()_=+\\';:"/?>.<,-]/g,
                    ''
                )
            );
            url.searchParams.set('entity', 'song');
            url.searchParams.set('limit', '5');

            const res = await fetch(url);

            if (res.status !== 200) {
                console.error(
                    `DiscordRPC: Failed to fetch external info: ${res.status}`
                );
            }

            let data = await res.json();

            if ((data.results?.length || 0) < 1) {
                const url = new URL('https://itunes.apple.com/search');

                url.searchParams.set(
                    'term',
                    `${normAlbumName} ${track.artist.name}`.replace(
                        /[@~`!@#$%^&()_=+\\';:"/?>.<,-]/g,
                        ''
                    )
                );
                url.searchParams.set('entity', 'song');
                url.searchParams.set('limit', '5');

                const res = await fetch(url);

                if (res.status !== 200) {
                    console.error(
                        `DiscordRPC: Failed to fetch external info: ${res.status}`
                    );
                }

                data = await res.json();
            }

            if (data.resultCount) {
                let result = data.results[0];

                for (const res of data.results) {
                    if (
                        res.artistName.toLowerCase() ===
                            track.artist.name.toLowerCase() &&
                        res.trackName.toLowerCase() ===
                            track.title.toLowerCase()
                    ) {
                        result = res;
                        break;
                    }
                }

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
        audio: Parameters<typeof this.api.stores.audio.set>[0],
        externalInfo: TrackData,
        vars: { [key: string]: string }
    ) {
        if (!audio) return;

        if (conf.discordRpcHideOnPause && get(this.api.stores.player).paused) {
            await invoke('clear_activity');
            return;
        }
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
                large_image: conf.discordRpcLargeImage
                    ? this.applyTemplate(
                          conf.discordRpcLargeImage as string,
                          vars
                      )
                    : undefined,
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
                start:
                    conf.discordRpcShowElapsed &&
                    !get(this.api.stores.player).paused
                        ? Math.round(
                              new Date().getTime() / 1000 - audio.currentTime
                          )
                        : undefined,
                buttons:
                    conf.discordRpcButtons && externalInfo.songLinkUrl
                        ? [{ label: 'Listen', url: externalInfo.songLinkUrl }]
                        : undefined,
                listeningType: conf.discordRpcListeningType
            }
        }).then(() => {
            console.info(
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
