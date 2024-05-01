import { readTextFile } from '@tauri-apps/api/fs';
import { get } from 'svelte/store';
import type { FriendlyTrack } from '../db';
import { audio } from '../stores';
import { removeExtension } from '../utils';
// import { getLyrics as getLyricsMM } from '../integrations/musixmatch';
import { eventManager } from '$lib/events';

export async function getLyrics(track: FriendlyTrack) {
    if (track.type === 'local') {
        try {
            const lrc = await readTextFile(
                `${removeExtension(track.location)}.lrc`
            );

            audio.set({
                ...get(audio),
                lyrics: {
                    format: 'lrc',
                    lyrics: lrc,
                    credits: 'Loaded from local file'
                }
            });
            return;
        } catch (e) {
            try {
                const txt = await readTextFile(
                    `${removeExtension(track.location)}.txt`
                );

                audio.set({
                    ...get(audio),
                    lyrics: {
                        format: 'plain',
                        lyrics: txt,
                        credits: 'Loaded from local file'
                    }
                });
                return;
            } catch (e) {
                /* ignore */
            }
        }
    }

    await eventManager.fireEvent('onLyricsRequested', track);
}
