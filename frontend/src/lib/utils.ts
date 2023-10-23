export function getTimestamp(seconds: number): string {
    // Time stamp in m:SS or h:MM:SS format
    if (seconds < 60 * 60) {
        return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
            .toString()
            .padStart(2, '0')}`;
    }

    return `${Math.floor(seconds / (60 * 60))}:${Math.floor(
        (seconds % (60 * 60)) / 60
    )}:${Math.floor(seconds % 60)
        .toString()
        .padStart(2, '0')}`;
}
