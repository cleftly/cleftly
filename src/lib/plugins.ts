// import { transpileModule } from 'typescript';
import { get } from 'svelte/store';
import { plugins } from './stores';
import { getStreamUrl } from './utils';
import DiscordRPC from './plugins/discordrpc';
import { getOrCreateConfig } from './config';
import Test1 from './plugins/test';
import { generateAPI } from './api/generate';

export interface PluginInfo {
    id: string;
    name: string;
    author: string;
    version: string;
    description?: string;
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
        author: plugin.constructor.author
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
        constr = (await import(/* @vite-ignore */ src)).default;
    }

    return constr;
}
export async function loadPluginFromFile(source: string) {
    return await loadPlugin(await loadPluginConstrFromFile(source));
}

export async function loadPlugins() {
    const BUILT_IN: { [key: string]: PluginConstructor } = {
        'com.cleftly.discordrpc': DiscordRPC as unknown as PluginConstructor,
        'com.cleftly.test1': Test1 as unknown as PluginConstructor
    };

    const enabled = [...(await getOrCreateConfig()).enabled_plugins];

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
            .map((id) => loadPluginFromFile(id))
    );
}
