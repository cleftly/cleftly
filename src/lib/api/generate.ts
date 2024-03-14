/*
    Generate API class for a Cleftly plugi
*/

import * as events from './events';
import * as config from './config';
import { audio, player, progress, queue } from '$lib/stores';

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
        }
    };
}
