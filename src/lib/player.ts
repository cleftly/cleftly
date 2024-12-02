import type * as mm from 'music-metadata-browser';
import { platform } from '@tauri-apps/plugin-os';

import { get } from 'svelte/store';
import { getLyrics } from './lyrics';
import type { FriendlyTrack } from './db';

import { nowPlaying } from './integrations/lastfm';
import { getStreamUrl } from './utils';
import { getOrCreateConfig } from './config';
import db from './db';
import { eventManager } from './events';
import WebBackend from './backends/web';
import NativeBackend from './backends/native';
import { INITIAL_AUDIO, audio, player, queue } from '$lib/stores';

export async function play(
    src: string,
    track: FriendlyTrack,
    queued?: FriendlyTrack[],
    queueIndex?: number,
    backend: 'native' | 'web' = 'native',
    shuffle: boolean = false
) {
    // if (backend == 'native') {
    //     await invoke('play_audio', {
    //         filePath: src
    //     }).catch(() => {
    //         const toastStore = getToastStore();

    //         toastStore.trigger({
    //             message: `<h1 class="text-lg">${get(_)(
    //                 'track_play_failure'
    //             )}</h1> <p class="text-sm">${get(_)('track_play_failure_at', {
    //                 values: { path: src }
    //             })}</p>`,
    //             background: 'variant-filled-error'
    //         });
    //     });
    // }

    audio.set({
        ...INITIAL_AUDIO,
        track,
        src: src,
        backend,
        playedAt: new Date()
    });

    player.set({
        ...get(player),
        backend:
            {
                web: new WebBackend(),
                native: new NativeBackend()
            }[backend] ?? null,
        paused: false
    });

    const playerVal = get(player);

    await playerVal.backend.init();
    await playerVal.backend.playTrack(track);
    await playerVal.backend.seek(0);
    await playerVal.backend.play();
    await playerVal.backend.setVolume(playerVal.volume);

    if (shuffle && queued) {
        const shuffled = queued
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

        queue.set({
            unshuffled: queued,
            index: 0,
            tracks: [...shuffled]
        });
    } else {
        queue.set({
            unshuffled: null,
            tracks: queued || [track],
            index:
                typeof queueIndex === 'number'
                    ? queueIndex
                    : Math.max(
                          0,
                          queued
                              ? queued.findIndex((t) => t.id === track.id)
                              : -1
                      )
        });
    }

    getLyrics(track)
        .then((lyrics) => {
            const aud = get(audio);

            console.info(
                `Lyrics: ${lyrics ? 'Got' : "Didn't get"} lyrics`,
                lyrics
            );

            if (!lyrics || !aud) return;

            aud.lyrics = lyrics;
        })
        .catch((err) => {
            console.error(err);
            console.error('Failed to find lyrics');
        });

    nowPlaying(track)
        .then((res) => {
            if (res) {
                console.info('Last.FM: Now playing track', res.data);
            }
        })
        .catch((e) => {
            console.error(e);
            console.error('Last.FM: Failed to update now playing');
        });

    eventManager
        .fireEvent('onTrackPlay', get(audio))
        .then(() => {})
        .catch((err) => {
            console.error(err);
            console.error('Failed to fire event onTrackPlay');
        });

    eventManager
        .fireEvent('onTrackChange', get(audio))
        .then(() => {})
        .catch((err) => {
            console.error(err);
            console.error('Failed to fire event onTrackChange');
        });

    db.tracks
        .update(track.id, {
            lastPlayedAt: new Date()
        })
        .then(() => {});
}

export function parseMMMetadata(
    metadata: mm.IAudioMetadata,
    name: string = ''
) {
    return {
        title: metadata.common.title || name,
        artist: metadata.common.artist,
        album: metadata.common.album,
        albumArt:
            metadata.common.picture && metadata.common.picture.length > 0
                ? new Blob([metadata.common.picture[0].data], {
                      type: metadata.common.picture[0].format
                  })
                : '',
        genres: metadata.common.genre,
        year: metadata.common.year,
        trackNum: metadata.common.track.no || 1,
        totalTracks: metadata.common.track.of || 1,
        discNum: metadata.common.disk.no || 1,
        totalDiscs: metadata.common.disk.of || 1,
        duration: metadata.format.duration || 0,
        format: {
            bitrate: metadata.format.bitrate || 0,
            lossless: metadata.format.lossless || false,
            codec: metadata.format.codec,
            codecProfile: metadata.format.codecProfile
        }
    };
}

export async function playTrack(
    track: FriendlyTrack,
    queued?: FriendlyTrack[],
    index?: number,
    shuffle: boolean = false
) {
    const backend = (await getOrCreateConfig()).audio_backend;

    if (backend === 'web') {
        switch (track.type || 'local') {
            case 'local': {
                if ((await platform()) === 'linux') {
                    const streamUrl = await getStreamUrl(track.location);

                    // Convert to blob as streaming is broken on linux

                    const blob = await fetch(streamUrl).then((res) =>
                        res.blob()
                    );

                    const url = URL.createObjectURL(blob);

                    await play(url, track, queued, index, backend, shuffle);
                } else {
                    const streamUrl = await getStreamUrl(track.location);

                    await play(
                        streamUrl,
                        track,
                        queued,
                        index,
                        backend,
                        shuffle
                    );
                }
                break;
            }
            case 'http': {
                let parsedTrack = track;

                if (typeof track.location === 'function') {
                    parsedTrack = {
                        ...parsedTrack,
                        location: await track.location()
                    };
                }

                await play(
                    parsedTrack.location,
                    track,
                    queued,
                    index,
                    backend,
                    shuffle
                );
                break;
            }
            default: {
                throw new Error('Not implemented');
                break;
            }
        }
    } else {
        await play(track.location, track, queued, index, backend, shuffle);
    }
}
