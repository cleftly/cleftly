import { md5 } from 'js-md5';
import { fetch } from '@tauri-apps/plugin-http';
import type { FriendlyTrack } from '$lib/db';
import { getOrCreateConfig } from '$lib/config';

export const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Generates a Last.FM API signature
 */
export async function signCall(
    secret: string,
    params: { [key: string]: unknown }
) {
    const raw =
        Object.entries(params)
            .filter(([key]) => !['format', 'callback'].includes(key))
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, value]) => `${key}${value}`)
            .join('') + secret;

    const hash = md5.create().update(raw).hex();

    return hash;
}

export async function nowPlaying(track: FriendlyTrack) {
    const sk = (await getOrCreateConfig()).lastfm_token;

    if (!sk) return;

    const params: { [key: string]: string } = {
        method: 'track.updateNowPlaying',
        track: track.title,
        artist: track.artist.name,
        album: track.album.name,
        trackNumber: `${track.trackNum}`,
        duration: `${Math.round(track.duration)}`,
        api_key: import.meta.env.PUBLIC_LASTFM_API_KEY,
        format: 'json',
        sk
    };

    const url = new URL(BASE_URL);
    Object.keys(params).forEach((key) =>
        url.searchParams.append(key, params[key])
    );
    url.searchParams.append(
        'api_sig',
        await signCall(import.meta.env.PUBLIC_LASTFM_API_SECRET, params)
    );
    return await fetch(url, {
        method: 'POST'
    });
}

export async function scrobble(track: FriendlyTrack, played_at: Date) {
    const sk = (await getOrCreateConfig()).lastfm_token;

    if (!sk) return;

    const params: { [key: string]: string } = {
        method: 'track.scrobble',
        track: track.title,
        artist: track.artist.name,
        album: track.album.name,
        trackNumber: `${track.trackNum}`,
        duration: `${Math.round(track.duration)}`,
        timestamp: `${Math.round(played_at.getTime() / 1000)}`,
        api_key: import.meta.env.PUBLIC_LASTFM_API_KEY,
        format: 'json',
        sk
    };

    const url = new URL(BASE_URL);
    Object.keys(params).forEach((key) =>
        url.searchParams.append(key, params[key])
    );
    url.searchParams.append(
        'api_sig',
        await signCall(import.meta.env.PUBLIC_LASTFM_API_SECRET, params)
    );

    return await fetch(url, {
        method: 'POST'
    });
}
