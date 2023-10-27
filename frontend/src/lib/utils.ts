/* General utilities to make life easier and code more readable */

export const supportedExtensions = [
    'wav',
    'wave',
    'mp3',
    'mp4',
    'm4a',
    'aac',
    'ogg',
    'flac',
    'webm',
    'caf'
];

export function getTimestamp(seconds: number): string {
    // Time stamp in m:SS or h:MM:SS format
    if (seconds < 60 * 60) {
        return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
            .toString()
            .padStart(2, '0')}`;
    }

    return `${Math.floor(seconds / (60 * 60))}:${Math.floor(
        (seconds % (60 * 60)) / 60
    )
        .toString()
        .padStart(2, '0')}}:${Math.floor(seconds % 60)
        .toString()
        .padStart(2, '0')}`;
}
