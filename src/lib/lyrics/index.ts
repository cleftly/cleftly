import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';
import type { FriendlyTrack } from '../db';
import type { Lyrics } from '../stores';
import { removeExtension } from '../utils';
import { getLyrics as getLyricsMM } from '../integrations/musixmatch';
import { getOrCreateConfig } from '../config';

export async function getLyrics(track: FriendlyTrack): Promise<Lyrics | null> {
    if (track.type === 'local') {
        try {
            const lrc = await readTextFile(
                `${removeExtension(track.location)}.lrc`
            );

            return {
                format: 'lrc',
                lyrics: lrc,
                credits: 'Loaded from local file'
            };
        } catch (e) {
            try {
                const txt = await readTextFile(
                    `${removeExtension(track.location)}.txt`
                );

                return {
                    format: 'plain',
                    lyrics: txt,
                    credits: 'Loaded from local file'
                };
            } catch (e) {
                /* ignore */
            }
        }
    }

    const mmLyrics = await getLyricsMM(
        track,
        true,
        (
            await getOrCreateConfig()
        ).lyrics_richsync
    );

    if (!(await getOrCreateConfig()).lyrics_save) {
        return mmLyrics;
    }

    try {
        if (mmLyrics?.format === 'lrc') {
            await writeTextFile(
                `${removeExtension(track.location)}.lrc`,
                mmLyrics.lyrics
            );
        } else if (mmLyrics?.format === 'plain') {
            await writeTextFile(
                `${removeExtension(track.location)}.txt`,
                mmLyrics.lyrics
            );
        }
    } catch (e) {
        console.error(e);
        console.error('Failed to save lyrics to disk');
    }

    return mmLyrics;
}
