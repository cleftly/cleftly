/**
 * Utilities for parsing musixmatch richsync lyrics
 */

export type RichSyncLyric = {
    timestamp: number;
    end?: number;
    line: string;
    parts: {
        text: string;
        timestamp: number;
    }[];
};

export function parseRichSyncLyrics(
    lyrics: {
        ts: number; // Time start
        te: number; // Time end
        x: string;
        l: { c: string; o: number }[];
    }[]
): RichSyncLyric[] {
    const parsed = lyrics
        .map((lyric) => {
            return {
                timestamp: lyric.ts,
                end: lyric.te,
                line: lyric.x,
                parts: lyric.l
                    .map((part) => {
                        return {
                            text: part.c,
                            timestamp: lyric.ts + part.o
                        };
                    })
                    .filter((part) => {
                        return part.text.length > 0;
                    })
            } as RichSyncLyric;
        })
        .filter((lyric) => {
            return lyric.line.length > 0;
        });

    for (let i = 0; i < parsed.length - 1; i++) {
        if (parsed[i]?.end && parsed[i + 1].timestamp - parsed[i].end > 3) {
            parsed.splice(i + 1, 0, {
                timestamp: parsed[i].end,
                end: parsed[i + 1].timestamp,
                line: '',
                parts: []
            });
        }
    }

    // Add a gap at the beginning
    if (parsed[0]?.timestamp !== 0) {
        parsed.unshift({
            timestamp: 0,
            line: '',
            parts: []
        });
    }

    return parsed;
}

export function getCurrentLineIndex(
    lyrics: RichSyncLyric[],
    currentTime: number
): number {
    for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].timestamp) {
            return i;
        }
    }

    return 0;
}

export function getCurrentWordIndex(
    line: RichSyncLyric,
    currentTime: number
): number {
    for (let i = line.parts.length - 1; i >= 0; i--) {
        if (currentTime >= line.parts[i].timestamp) {
            return i;
        }
    }

    return 0;
}
