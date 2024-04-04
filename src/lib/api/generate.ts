/*
    Generate API class for a Cleftly plugi
*/

import * as events from './events';
import * as config from './config';
import { audio, player, progress, queue } from '$lib/stores';
import packageJson from '$packageJson';

export type PluginAPI = {
    config: {
        getConfig: () => ReturnType<typeof config.getConfig>;
        saveConfig: (config: unknown) => Promise<void>;
    };
    events: typeof events;
    stores: {
        audio: typeof audio;
        player: typeof player;
        progress: typeof progress;
        queue: typeof queue;
    };
    version: string;
};

export function generateAPI(pluginId: string): PluginAPI {
    return {
        config: {
            ...config,
            getConfig: () => config.getConfig(pluginId),
            saveConfig: (conf) => config.saveConfig(pluginId, conf)
        },
        events,
        stores: {
            audio,
            player,
            progress,
            queue
        },
        version: packageJson.version
    };
}
