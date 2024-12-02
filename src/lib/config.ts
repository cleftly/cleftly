import { BaseDirectory, appConfigDir, appCacheDir } from '@tauri-apps/api/path';
import { writeTextFile, mkdir, exists, readFile } from '@tauri-apps/plugin-fs';

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
    if (!(await exists('config.json', { baseDir: BaseDirectory.AppConfig }))) {
        if (!(await exists(await appConfigDir()))) {
            await mkdir('', {
                baseDir: BaseDirectory.AppConfig,
                recursive: true
            });
        }

        await writeTextFile('config.json', JSON.stringify(DEFAULT_CONFIG), {
            baseDir: BaseDirectory.AppConfig
        });
    }

    const configTxt = new TextDecoder().decode(
        await readFile('config.json', {
            baseDir: BaseDirectory.AppConfig
        })
    );

    if (!configTxt.trim()) {
        await writeTextFile('config.json', JSON.stringify(DEFAULT_CONFIG), {
            baseDir: BaseDirectory.AppConfig
        });
    }

    return {
        ...DEFAULT_CONFIG,
        ...(configTxt.trim() ? JSON.parse(configTxt) : {})
    } as Config;
}

export async function saveConfig(config: Config) {
    await writeTextFile('config.json', JSON.stringify(config), {
        baseDir: BaseDirectory.AppConfig
    });
}

export async function getOrCreateCacheDir() {
    const dir = await appCacheDir();

    // // Make sure config dir and file exist
    if (!(await exists(dir))) {
        await mkdir('', {
            baseDir: BaseDirectory.AppCache,
            recursive: true
        });
    }

    return dir;
}
