/* 
    Utilities for working with LRC files

    Based on https://github.com/weirongxu/lrc-kit/blob/master/src/line-parser.ts

    The MIT License (MIT)

    Copyright (c) 2016 Weirong Xu
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

// match `[12:30.1][12:30.2]`
export const TAGS_REGEXP = /^(\[.+\])+/;
// match `[ti: The Title]`
export const INFO_REGEXP = /^\s*(\w+)\s*:(.*)$/;
// match `[512:34.1] lyric content`

export const TIME_REGEXP = /^\s*(\d+)\s*:\s*(\d+(\s*[.:]\s*\d+)?)\s*$/;

export interface TimeLine {
    timestamps: number[];
    content: string;
}

export interface Lyric {
    timestamp: number;
    content: string;
}

export function parseTags(line: string): null | [string[], string] {
    line = line.trim();
    const matches = TAGS_REGEXP.exec(line);

    if (matches === null) {
        return null;
    }

    const tag = matches[0];
    const content = line.substring(tag.length);

    return [tag.slice(1, -1).split(/\]\s*\[/), content];
}

export function parseTime(tags: string[], content: string): TimeLine {
    const timestamps: number[] = [];

    tags.forEach((tag) => {
        const matches = TIME_REGEXP.exec(tag)!;
        const minutes = parseFloat(matches[1]);
        const seconds = parseFloat(
            matches[2].replace(/\s+/g, '').replace(':', '.')
        );
        timestamps.push(minutes * 60 + seconds);
    });

    return {
        timestamps,
        content: content.trim()
    };
}

/**
 * line parse lrc of timestamp
 * @example
 * const lp = parseLine('[ti: Song title]')
 * lp.type === LineParser.TYPE.INFO
 * lp.key === 'ti'
 * lp.value === 'Song title'
 *
 * const lp = parseLine('[10:10.10]hello')
 * lp.type === LineParser.TYPE.TIME
 * lp.timestamps === [10*60+10.10]
 * lp.content === 'hello'
 */
export function parseLine(line: string): TimeLine | null {
    const parsedTags = parseTags(line);
    try {
        if (parsedTags) {
            const [tags, content] = parsedTags;
            if (TIME_REGEXP.test(tags[0])) {
                return parseTime(tags, content);
            } else {
                return null;
            }
        }
        return null;
    } catch (_e) {
        return null;
    }
}

export function parse(text: string) {
    const lyrics: Lyric[] = [];

    text.split(/\r\n|[\n\r]/g)
        .map((line) => {
            return parseLine(line);
        })
        .forEach((line) => {
            if (!line) return;

            line.timestamps.forEach((timestamp) => {
                lyrics.push({
                    timestamp: timestamp,
                    content: line.content
                });
            });
        });

    if (lyrics[0]?.timestamp !== 0) {
        lyrics.unshift({
            timestamp: 0,
            content: ''
        });
    }

    return lyrics;
}
