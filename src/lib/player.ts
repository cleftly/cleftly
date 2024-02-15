import type * as mm from 'music-metadata-browser';
import { platform } from '@tauri-apps/api/os';

import { get } from 'svelte/store';
import { invoke } from '@tauri-apps/api';
import { getToastStore } from '@skeletonlabs/skeleton';
import { _ } from 'svelte-i18n';
import { getLyrics } from './lyrics';
import type { FriendlyTrack } from './db';

import { nowPlaying } from './integrations/lastfm';
import { getStreamUrl } from './utils';
import { getOrCreateConfig } from './config';
import db from './db';
import { eventManager } from './events';
import { INITIAL_AUDIO, audio, player, queue } from '$lib/stores';

async function play(
    src: string,
    track: FriendlyTrack,
    queued?: FriendlyTrack[],
    queueIndex?: number,
    backend: 'native' | 'web' = 'native'
) {
    if (backend == 'native') {
        await invoke('play_audio', {
            filePath: src
        }).catch(() => {
            const toastStore = getToastStore();

            toastStore.trigger({
                message: `<h1 class="text-lg">${get(_)(
                    'track_play_failure'
                )}</h1> <p class="text-sm">${get(_)('track_play_failure_at', {
                    values: { path: src }
                })}</p>`,
                background: 'variant-filled-error'
            });
        });
    }

    audio.set({
        ...INITIAL_AUDIO,
        track,
        src: src,
        backend,
        playedAt: new Date()
    });

    player.set({
        ...get(player),
        paused: false
    });

    queue.set({
        unshuffled: null,
        tracks: queued || [track],
        index:
            typeof queueIndex === 'number'
                ? queueIndex
                : Math.max(
                      0,
                      queued ? queued.findIndex((t) => t.id === track.id) : -1
                  )
    });

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
        .fireEvent('on_track_change', get(audio))
        .then(() => {})
        .catch((err) => {
            console.error(err);
            console.error('Failed to fire event on_track_change');
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
    index?: number
) {
    const backend = (await getOrCreateConfig()).audio_backend;

    if (backend === 'web') {
        if ((track.type || 'local') === 'local') {
            if ((await platform()) === 'linux') {
                const streamUrl = await getStreamUrl(track.location);

                // Convert to blob as streaming is broken on linux

                const blob = await fetch(streamUrl).then((res) => res.blob());

                const url = URL.createObjectURL(blob);

                await play(url, track, queued, index, backend);
            } else {
                const streamUrl = await getStreamUrl(track.location);

                await play(streamUrl, track, queued, index, backend);
            }
        } else {
            // TODO
            console.error('Not implemented');
        }
    } else {
        await play(track.location, track, queued, index, backend);
    }
}

export async function syncCycle() {}
