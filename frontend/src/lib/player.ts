import { INITIAL_AUDIO, audio, queue } from '$lib/stores';
import type * as mm from 'music-metadata-browser';
import type { FriendlyTrack } from './db';

function play(src: string, track: FriendlyTrack, queued?: FriendlyTrack[]) {
    audio.set({
        ...INITIAL_AUDIO,
        track,
        src: src
    });
    queue.set({
        tracks: queued || [track],
        index: Math.max(
            0,
            queued ? queued.findIndex((t) => t.id === track.id) : -1
        )
    });
}

export function parseMMMetadata(
    metadata: mm.IAudioMetadata,
    name: string = ''
) {
    return {
        title: metadata.common.title || name,
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        albumArt:
            metadata.common.picture && metadata.common.picture.length > 0
                ? new Blob([metadata.common.picture[0].data], {
                      type: metadata.common.picture[0].format
                  })
                : '',
        genres: metadata.common.genre || [],
        trackNum: metadata.common.track.no || 1,
        totalTracks: metadata.common.track.of || 1,
        duration: metadata.format.duration || 0,
        format: {
            bitrate: metadata.format.bitrate || 0,
            loseless: metadata.format.lossless || false,
            codec: metadata.format.codec,
            codecProfile: metadata.format.codecProfile
        }
    };
}

export async function playTrack(
    track: FriendlyTrack,
    queued?: FriendlyTrack[]
) {
    const url = `/localroot/${track.location}`;

    const blob = await (
        await fetch(url, {
            method: 'GET'
        })
    ).blob();

    const blobUrl = URL.createObjectURL(blob);
    play(blobUrl, track, queued);
}
