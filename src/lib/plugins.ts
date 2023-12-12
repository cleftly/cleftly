import { transpileModule } from 'typescript';
import { get } from 'svelte/store';
import { audio, queue, player, plugins } from './stores';
import { getStreamUrl } from './utils';
import DiscordRPC from './plugins/discordrpc';
import { getOrCreateConfig } from './config';
import Test1 from './plugins/test';

export type Plugin = {
    id: string;
    name: string;
    description?: string;
    version: string;
    author: string;
    subscribedTo?: string[];
    onEvent?: (event: string, data: unknown) => Promise<void> | void;
};

export interface PluginConstructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (apis?: any): Plugin; // TODO
}

export async function loadPlugin(constr: PluginConstructor) {
    const plugin = new constr({
        stores: {
            audio,
            queue,
            player
        }
    });

    // Add plugin to store
    plugins.update((val) => {
        val.set(plugin.id, plugin);
        return val;
    });

    return {
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        author: plugin.author
    };
}

export async function loadPluginFromFile(source: string) {
    const src = await getStreamUrl(source);

    let constr: PluginConstructor;

    if (source.endsWith('.ts')) {
        // Compile TS on the fly (Only useful for development - Plugins should be distributed pre-compiled)
        const tsconfig = {
            compilerOptions: {
                target: 2, // ES6
                module: 99, // ESNext
                lib: ['esnext', 'DOM', 'DOM.Iterable']
            }
        };

        const script = transpileModule(
            await (await fetch(src)).text(),
            tsconfig
        );

        constr = (
            await import(
                /* @vite-ignore */
                URL.createObjectURL(new Blob([script.outputText]))
            )
        ).default;
    } else {
        constr = (await import(/* @vite-ignore */ src)).default;
    }

    return await loadPlugin(constr);
}

export async function loadPlugins() {
    const BUILT_IN = {
        'com.cleftly.discordrpc': DiscordRPC,
        'com.cleftly.test1': Test1
    };

    const enabled = [
        ...(await getOrCreateConfig()).enabled_plugins,
        'com.cleftly.test1'
    ];

    /* Load all plugins from config and all built-in plugins */
    const loaded = get(plugins);

    // Ignore loaded plugins (TODO: Reload them instead)
    const toLoad = enabled.filter((id) => !loaded.has(id));

    // Load built-in plugins
    const builtIn = Object.keys(BUILT_IN)
        .filter((id) => enabled.includes(id))
        .map((id) => BUILT_IN[id]);

    // Load plugins
    await Promise.all(
        builtIn.concat(toLoad.map((id) => loadPlugin(BUILT_IN[id])))
    );

    // Load external plugins
    await Promise.all(
        enabled
            .filter((id) => !Object.keys(BUILT_IN).includes(id))
            .map((id) => loadPluginFromFile(id))
    );
}

export async function fireEvent(event: string, data: unknown) {
    // Fire events on all plugins

    const loadedPlugins = get(plugins);

    for (const plugin of loadedPlugins.values()) {
        if (!plugins.subscribedTo || !plugins.subscribedTo.includes(event)) {
            continue;
        }

        if (plugin.onEvent) {
            try {
                await plugin.onEvent(event, data);
            } catch (err) {
                console.error(err);
                console.error(
                    `Plugin ${plugin.id}: Failed to fire event ${event}`
                );
            }
        } else {
            console.warn(
                `Plugin ${plugin.id}: Plugin does not have an onEvent function but is subscribed to ${event}`
            );
        }
    }
}
