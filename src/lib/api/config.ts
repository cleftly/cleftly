/**
 * Configuration API to be used by Cleftly plugins
 */

import {
    BaseDirectory,
    exists,
    mkdir,
    readTextFile,
    writeTextFile
} from '@tauri-apps/plugin-fs';
import { appConfigDir } from '@tauri-apps/api/path';

export async function doesConfigExist(pluginId: string) {
    return await exists(`${pluginId}.config.json`, {
        baseDir: BaseDirectory.AppConfig
    });
}

export async function getConfig(pluginId: string) {
    const fileName = `${pluginId}.config.json`;

    // if (
    //     !(await exists(fileName, {
    //         dir: BaseDirectory.AppConfig
    //     }))
    // ) {
    if (!(await exists(await appConfigDir()))) {
        await mkdir('', {
            baseDir: BaseDirectory.AppConfig,
            recursive: true
        });
    }

    await writeTextFile(fileName, JSON.stringify({}), {
        baseDir: BaseDirectory.AppConfig
    });
    // }

    const configTxt = await readTextFile(fileName, {
        baseDir: BaseDirectory.AppConfig
    });

    if (!configTxt.trim()) {
        await writeTextFile(fileName, JSON.stringify({}), {
            baseDir: BaseDirectory.AppConfig
        });

        return {};
    }

    return JSON.parse(configTxt) as unknown;
}

export async function saveConfig(pluginId: string, config: unknown) {
    await writeTextFile(`${pluginId}.config.json`, JSON.stringify(config), {
        baseDir: BaseDirectory.AppConfig
    });
}
