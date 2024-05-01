<script lang="ts">
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { Plus } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import { open } from '@tauri-apps/api/dialog';
    import PluginCard from './PluginCard.svelte';
    import { getOrCreateConfig, saveConfig } from '$lib/config';
    import {
        loadPlugin,
        loadPluginConstrFromFile,
        type PluginConstructor,
        type PluginInfo
    } from '$lib/plugins';
    import DiscordRPC from '$lib/plugins/discordrpc';
    import { plugins } from '$lib/stores';
    import MusixmatchPlugin from '$lib/plugins/musixmatch';
    import LastFmPlugin from '$lib/plugins/lastfm';

    interface ExternalPluginInfo extends PluginInfo {
        file: string;
    }

    const toastStore = getToastStore();

    let allPlugins: (PluginInfo | ExternalPluginInfo)[] = [];
    let enabledPlugins: string[] = [];
    let loadedPlugins: string[] = [];
    let builtInPlugins: typeof allPlugins = [];
    let externalPlugins: typeof allPlugins = [];

    $: allPlugins, (builtInPlugins = allPlugins.filter((e) => !e.file));
    $: allPlugins, (externalPlugins = allPlugins.filter((e) => e.file));

    onMount(async () => {
        refreshList();
    });

    async function importPlugin() {
        const file = await open({
            multiple: false,
            filters: [
                {
                    name: 'Plugin',
                    extensions: ['js', 'ts', 'mjs', 'cjs']
                }
            ]
        });

        if (!file) return;

        const fileName = (file instanceof Array ? file[0] : file) as string;

        console.log(fileName);
        if (allPlugins.find((e) => e.file === fileName)) {
            toastStore.trigger({
                message: $_('plugin_already_added')
            });
            return;
        }

        let plugin: PluginConstructor;

        try {
            plugin = await loadPluginConstrFromFile(fileName);
        } catch (err) {
            console.error(err);

            toastStore.trigger({
                message: `<h1 class="text-lg">${$_(
                    'plugin_import_error'
                )}</h1><p class="text-sm">${err}`,
                background: 'variant-filled-error'
            });

            return;
        }

        if (allPlugins.find((e) => e.id === plugin.id)) {
            toastStore.trigger({
                message: $_('plugin_already_added')
            });
            return;
        }

        allPlugins = [
            ...allPlugins,
            {
                ...plugin,
                file: fileName
            }
        ];

        const conf = await getOrCreateConfig();
        await saveConfig({
            ...conf,
            plugins: { ...conf.plugins, [plugin.id]: fileName },
            enabled_plugins: [...conf.enabled_plugins]
        });

        loadedPlugins = Array.from($plugins.keys());
        enabledPlugins = (await getOrCreateConfig()).enabled_plugins || [];

        // Load plugin fully
        await loadPlugin(plugin);
    }

    async function refreshList() {
        const externalPluginFiles = Object.values(
            (await getOrCreateConfig()).plugins
        );

        allPlugins = [
            DiscordRPC,
            MusixmatchPlugin,
            LastFmPlugin,
            ...(await Promise.all(
                externalPluginFiles.map(async (file) => {
                    const plug = await loadPluginConstrFromFile(file);

                    return {
                        ...plug,
                        file
                    };
                })
            ))
        ];

        enabledPlugins = (await getOrCreateConfig()).enabled_plugins || [];

        console.log(enabledPlugins, loadedPlugins);
    }

    $: loadedPlugins = Array.from($plugins.keys());
</script>

<div class="space-y-2">
    {#if (enabledPlugins.length > 0 || loadedPlugins.length > 0) && !(enabledPlugins.every( (i) => loadedPlugins.find((i2) => i === i2) ) && loadedPlugins.every( (i) => enabledPlugins.find((i2) => i === i2) ))}
        <aside class="alert variant-filled-warning">
            <div class="alert-message">
                <h3 class="text-xl">{$_('plugins_reload_required')}</h3>
                <p>{$_('plugins_reload_required_desc')}</p>
            </div>

            <div class="alert-actions">
                <button
                    class="btn variant-filled-primary"
                    on:click={() => {
                        window.location.reload();
                    }}>{$_('reload')}</button
                >
            </div>
        </aside>
    {/if}
    <h1 class="text-3xl">{$_('plugins')}</h1>

    <h2 class="text-xl">
        {$_('built_in')}
    </h2>

    {#each builtInPlugins as plugin}
        <PluginCard
            {plugin}
            enabled={enabledPlugins.includes(plugin.id)}
            bind:enabledPlugins
        />
    {/each}

    <h2 class="text-xl">
        {$_('third_party')}
    </h2>
    <button class="btn variant-ghost" on:click={importPlugin}>
        <Plus class="mr-2" />
        {$_('import')}
    </button>

    {#each externalPlugins as plugin}
        <PluginCard
            {plugin}
            enabled={enabledPlugins.includes(plugin.id)}
            bind:enabledPlugins
            {refreshList}
        />
    {/each}
    {#if externalPlugins.length === 0}
        <p class="text-slate-400">
            {$_('no_plugins')}
        </p>
    {/if}
</div>
