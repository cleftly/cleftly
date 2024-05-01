// import { transpileModule } from 'typescript';
import { get } from 'svelte/store';
import { plugins } from './stores';
import { getStreamUrl } from './utils';
import DiscordRPC from './plugins/discordrpc';
import MusixmatchPlugin from './plugins/musixmatch';

import { getOrCreateConfig } from './config';
import { generateAPI } from './api/generate';
import LastFmPlugin from './plugins/lastfm';

export interface PluginInfo {
    id: string;
    name: string;
    author: string;
    version: string;
    description?: string;
    license?: string;
    features?: string[];
    featnote?: string[];
    config_settings?: {
        [key: string]: {
            name: string;
            description: string;
            type: 'bool' | 'string' | 'number' | 'dir' | 'dirs';
        };
    };
}

export interface Plugin extends PluginInfo {
    constructor: PluginConstructor;
    onDestroy?(): void;
}

export interface PluginConstructor extends PluginInfo {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (apis?: any): Plugin; // TODO
}

export async function loadPlugin(constr: PluginConstructor) {
    if (!constr.id) {
        throw new Error(`Plugin has no id`);
    }

    console.info(
        `Initializing plugin ${constr.name} v${constr.version} by ${constr.author} (${constr.id})...`
    );

    const plugin = new constr(generateAPI(constr.id));

    // Add plugin to store
    plugins.update((val) => {
        val.set(constr.id, plugin);
        return val;
    });

    console.info(
        `Loaded plugin ${plugin.constructor.name} v${plugin.constructor.version} by ${plugin.constructor.author} (${plugin.constructor.id})`
    );

    return {
        id: plugin.constructor.id,
        name: plugin.constructor.name,
        description: plugin.constructor.description,
        version: plugin.constructor.version,
        author: plugin.constructor.author,
        license: plugin.constructor.license,
        features: plugin.constructor.features || []
    };
}

export async function loadPluginConstrFromFile(source: string) {
    const src = await getStreamUrl(source);

    let constr: PluginConstructor;
    // TODO: TO FIX (run tsc command externally instead of bloating app with TS)
    if (source.endsWith('.ts')) {
        // Compile TS on the fly (Only useful for development - Plugins should be distributed pre-compiled)
        // const tsconfig = {
        //     compilerOptions: {
        //         target: 2, // ES6
        //         module: 99, // ESNext
        //         lib: ['esnext', 'DOM', 'DOM.Iterable']
        //     }
        // };

        // const script = transpileModule(
        //     await (await fetch(src)).text(),
        //     tsconfig
        // );

        const script = {
            outputText: "alert('Please use a JS file for now');"
        };

        constr = (
            await import(
                /* @vite-ignore */
                URL.createObjectURL(new Blob([script.outputText]))
            )
        ).default;
    } else {
        const script = await (await fetch(`${src}?uuid=${Date.now()}`)).text();
        const scriptBlobUrl = URL.createObjectURL(
            new Blob([script], { type: 'text/javascript' })
        );
        constr = (await import(/* @vite-ignore */ scriptBlobUrl)).default;
    }

    return constr;
}
export async function loadPluginFromFile(source: string) {
    return await loadPlugin(await loadPluginConstrFromFile(source));
}

export async function loadPlugins() {
    const BUILT_IN: { [key: string]: PluginConstructor } = {
        'com.cleftly.discordrpc': DiscordRPC as unknown as PluginConstructor,
        'com.cleftly.musixmatch':
            MusixmatchPlugin as unknown as PluginConstructor,
        'com.cleftly.lastfm': LastFmPlugin as unknown as PluginConstructor
    };

    const conf = await getOrCreateConfig();
    const enabled = conf.enabled_plugins;

    /* Load all plugins from config and all built-in plugins */
    const loaded = get(plugins);

    // Ignore loaded plugins (TODO?: Reload them instead)
    const toLoad = enabled.filter((id) => !loaded.has(id));

    // Load built-in plugins
    const builtIn = Object.keys(BUILT_IN)
        .filter((id) => toLoad.includes(id))
        .map((id) => BUILT_IN[id]);

    await Promise.all(builtIn.map((id) => loadPlugin(id)));

    // Load external plugins
    await Promise.all(
        toLoad
            .filter((id) => !Object.keys(BUILT_IN).includes(id))
            .map((id) => loadPluginFromFile(conf.plugins[id]))
    );
}
