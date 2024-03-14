/*
 Get lyrics from musixmatch
*/
import { getClient } from '@tauri-apps/api/http';
import type { FriendlyTrack } from '$lib/db';
import db from '$lib/db';
import type { Lyrics } from '$lib/stores';

const BASE_URL = 'https://apic-desktop.musixmatch.com/ws/1.1';
const CACHE_DUR_MS = 600000; // 10 minutes

async function fetchToken() {
    // Check for cached
    const cache = await db.kvs.get('musixmatch_token');
    const cacheExp = await db.kvs.get('musixmatch_exp');

    if (
        cache?.value &&
        cacheExp?.value &&
        (cacheExp.value as Date) > new Date(new Date().getTime() - CACHE_DUR_MS)
    ) {
        return cache.value as string;
    }

    // https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-app-v1.0
    const client = await getClient();

    const res = await client.request({
        method: 'GET',
        url: `${BASE_URL}/token.get`,
        query: {
            app_id: 'web-desktop-app-v1.0'
        },
        headers: {
            Cookie: `AWSELBCORS=0; AWSELB=0;`,
            Authority: 'apic-desktop.musixmatch.com'
        }
    });

    if (res.status !== 200) {
        throw res;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = res.data as any;

    const tok =
        data?.message?.body?.user_token || (cache?.value as string | undefined);

    if (!tok) {
        throw new Error('Could not get MusixMatch token');
    }

    await db.kvs.bulkPut([
        {
            key: 'musixmatch_token',
            value: tok
        },
        {
            key: 'musixmatch_exp',
            value: new Date(new Date().getTime() + CACHE_DUR_MS)
        }
    ]);

    return tok;
}

export async function getLyrics(
    track: FriendlyTrack,
    retry = true,
    allowRichSync = true
): Promise<Lyrics | null> {
    const token = await fetchToken();

    const client = await getClient();

    const res = await client.request({
        method: 'GET',
        url: `${BASE_URL}/macro.subtitles.get`,
        query: {
            format: 'json',
            namespace: 'lyrics_richsynched',
            subtitle_format: 'lrc',
            app_id: 'web-desktop-app-v1.0',
            usertoken: token,
            q_track: track.title,
            q_artist: track.artist.name,
            q_album: track.album.name,
            track_spotify_id: '',
            q_duration: `${Math.round(track.duration)}`,
            f_subtitle_length: `${Math.round(track.duration)}`,
            f_subtitle_length_max_deviation: `40`,
            optional_calls: allowRichSync ? 'track.richsync' : ''
        },
        headers: {
            Cookie: `AWSELBCORS=0; AWSELB=0; x-mxm-token-guid=${token};`,
            Authority: 'apic-desktop.musixmatch.com'
        }
    });

    if (res.status !== 200) {
        throw res;
    }

    /* Unknown object */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = res.data as any;

    if (data.message?.header?.status_code !== 200) {
        // Rate limiting
        if (data.message?.header?.status_code === 401 && retry) {
            console.warn(
                'MusixMatch: 401 error (possibly rate limiting), retrying'
            );
            await db.kvs.put({
                key: 'musixmatch_exp',
                value: new Date(0)
            });
            return await getLyrics(track, false);
        }

        throw data;
    }

    const trackRichLyrics =
        data['message']?.['body']?.['macro_calls']?.['track.richsync.get']?.[
            'message'
        ]?.['body']?.['richsync']?.['richsync_body'];
    const trackLyricsGet =
        data['message']?.['body']?.['macro_calls']?.['track.lyrics.get']?.[
            'message'
        ]?.['body']?.['lyrics'];
    const liveSubtitles =
        data['message']?.['body']?.['macro_calls']?.['track.subtitles.get']?.[
            'message'
        ]?.['body']?.['subtitle_list']?.[0]?.['subtitle']?.['subtitle_body'];
    const textSubtitles = trackLyricsGet?.['lyrics_body'];
    const credits = trackLyricsGet?.['lyrics_copyright'];
    const format = trackRichLyrics
        ? 'richsync'
        : liveSubtitles
        ? 'lrc'
        : 'plain';

    if (!liveSubtitles && !textSubtitles) {
        return null;
    }

    return {
        lyrics: trackRichLyrics || liveSubtitles || textSubtitles,
        format,
        credits
    };
}
