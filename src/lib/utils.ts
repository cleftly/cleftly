/* General utilities to make life easier and code more readable */
import { convertFileSrc } from '@tauri-apps/api/core';
import { platform } from '@tauri-apps/plugin-os';

export const supportedExtensions = [
    'wav',
    'wave',
    'mp3',
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

export function removeExtension(path: string): string {
    const parts = path.split('.');

    if (parts.length < 2) return path;

    return parts.slice(0, -1).join('.');
}

export async function getStreamUrl(path: string) {
    return convertFileSrc(path, 'stream');
}

export function isMobile() {
    return platform() === 'android' || platform() === 'ios';
}
