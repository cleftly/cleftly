import {
    sep,
    BaseDirectory,
    appConfigDir,
    appCacheDir
} from '@tauri-apps/api/path';
import {
    readDir,
    readTextFile,
    writeTextFile,
    createDir,
    type FileEntry,
    exists
} from '@tauri-apps/api/fs';

export type Config = {
    version: number;
    music_directories: string[];
    setup_done: boolean;
    lastfm_token: string;
    audio_backend: 'native' | 'web';
    lyrics_save: boolean;
    lyrics_richsync: boolean;
    locale: string | null;
    plugins: { [key: string]: string };
    enabled_plugins: string[];
    theme: string;
    color: 'light' | 'dark' | 'oled';
    lang: string | null;
    [key: string]: unknown;
};

const DEFAULT_CONFIG = {
    version: 0,
    music_directories: [],
    setup_done: false,
    lastfm_token: '',
    audio_backend: 'web',
    lyrics_save: false,
    lyrics_richsync: false,
    locale: null,
    plugins: {},
    enabled_plugins: [
        'com.cleftly.discordrpc',
        'com.cleftly.musixmatch',
        'com.cleftly.lastfm'
    ],
    theme: 'crimson',
    color: 'dark',
    lang: null
};

export async function getOrCreateConfig() {
    // Make sure config dir and file exist
    if (!(await exists('config.json', { dir: BaseDirectory.AppConfig }))) {
        if (!(await exists(await appConfigDir()))) {
            await createDir('', {
                dir: BaseDirectory.AppConfig,
                recursive: true
            });
        }

        await writeTextFile('config.json', JSON.stringify(DEFAULT_CONFIG), {
            dir: BaseDirectory.AppConfig
        });
    }

    const configTxt = await readTextFile('config.json', {
        dir: BaseDirectory.AppConfig
    });

    if (!configTxt.trim()) {
        await writeTextFile('config.json', JSON.stringify(DEFAULT_CONFIG), {
            dir: BaseDirectory.AppConfig
        });
    }

    return {
        ...DEFAULT_CONFIG, // In case we added new properties
        ...JSON.parse(configTxt)
    } as Config;
}

export async function saveConfig(config: Config) {
    await writeTextFile('config.json', JSON.stringify(config), {
        dir: BaseDirectory.AppConfig
    });
}

export function splitPath(path: string) {
    return path.split(sep);
}

export async function walkDir(path: string) {
    const entries = await readDir(path, {
        recursive: true
    });

    const files: string[] = [];

    async function walk(entries: FileEntry[]) {
        for (const entry of entries) {
            if (entry.children) {
                await walk(entry.children);
            } else {
                files.push(entry.path);
            }
        }
    }

    await walk(entries);

    return files;
}

export async function getOrCreateCacheDir() {
    const dir = await appCacheDir();

    // Make sure config dir and file exist
    if (!(await exists(dir))) {
        await createDir('', {
            dir: BaseDirectory.AppCache,
            recursive: true
        });
    }

    return dir;
}
