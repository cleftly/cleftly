import { audio, queue, player } from './stores';
import { getStreamUrl } from './utils';

export async function loadPlugin(source: string) {
    const src = await getStreamUrl(source);

    const { default: Plugin } = await import(src);

    const plugin = new Plugin({
        stores: {
            audio,
            queue,
            player
        }
    });

    console.info(
        `%cLoaded plugin: ${plugin.name} (${plugin.version}) by ${plugin.author} (Source: ${source})`,
        'color: fuchsia'
    );
}
