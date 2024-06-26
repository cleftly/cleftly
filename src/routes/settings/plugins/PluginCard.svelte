<script lang="ts">
    import { SlideToggle, getToastStore } from '@skeletonlabs/skeleton';
    import { Globe, Settings, Trash } from 'lucide-svelte';
    import { _ } from 'svelte-i18n';
    import { onMount, type ComponentType } from 'svelte';
    import Option from '../Option.svelte';
    import type { PluginInfo } from '$lib/plugins';
    import { getOrCreateConfig, saveConfig } from '$lib/config';
    import {
        doesConfigExist,
        getConfig as getPluginConfig,
        saveConfig as savePluginConfig
    } from '$lib/api/config';

    interface ExternalPluginInfo extends PluginInfo {
        file: string;
    }

    const toastStore = getToastStore();

    let pluginConf: unknown | null = null;
    let showSettings = false;

    async function toggleEnabled(
        e: InputEvent,
        plugin: PluginInfo | ExternalPluginInfo
    ) {
        // @ts-expect-error Weird typing
        const enabled = e.target?.checked;

        const conf = await getOrCreateConfig();

        if (enabled) {
            await saveConfig({
                ...conf,
                enabled_plugins: [...conf.enabled_plugins, plugin.id]
            });
        } else {
            await saveConfig({
                ...conf,
                enabled_plugins: conf.enabled_plugins.filter(
                    (p) => p !== plugin.id
                )
            });
        }

        enabledPlugins = (await getOrCreateConfig()).enabled_plugins || [];
    }

    async function removePlugin(plugin: ExternalPluginInfo) {
        const conf = await getOrCreateConfig();

        await saveConfig({
            ...conf,
            plugins: Object.fromEntries(
                Object.entries(conf.plugins).filter(([k]) => k !== plugin.id)
            ),
            enabled_plugins: conf.enabled_plugins.filter((p) => p !== plugin.id)
        });

        enabledPlugins = (await getOrCreateConfig()).enabled_plugins || [];

        refreshList();
    }

    function updPluginConf() {
        if (pluginConf && plugin) {
            getPluginConfig(plugin.id).then((prevConf) => {
                if (JSON.stringify(pluginConf) === JSON.stringify(prevConf)) {
                    return;
                }

                savePluginConfig(plugin.id, pluginConf)
                    .then(() => {})
                    .catch((err) => {
                        console.error(err);
                        toastStore.trigger({
                            message: $_('config_save_fail'),
                            background: 'variant-filled-error'
                        });
                    });
            });
        }
    }

    $: pluginConf, updPluginConf();

    onMount(async () => {
        if (await doesConfigExist(plugin.id)) {
            pluginConf = await getPluginConfig(plugin.id);
        }
    });

    export let plugin: PluginInfo | ExternalPluginInfo;
    export let enabled: boolean;
    export let enabledPlugins: string[];
    export let refreshList: () => Promise<void>;

    const featNotes: {
        [key: string]: {
            icon: ComponentType;
            text: string;
            tooltip: string;
        };
    } = {
        network: {
            icon: Globe,
            text: 'Accesses the internet',
            tooltip:
                'This plugin may connect to the internet to retrieve necessary data' // TODO: i18n
        }
    };

    console.log();
</script>

<div class="card p-4 rounded-xl space-y-2">
    <div>
        <h3 class="text-xl">{plugin.name || plugin.id}</h3>

        <h4 class="text-slate-400">Version {plugin.version}</h4>
        <h4 class="text-slate-400">By {plugin.author}</h4>
    </div>

    <p class="text-slate-400 whitespace-break-spaces">
        {plugin.description || 'No description provided.'}
    </p>

    {#if plugin.featnote}
        <div>
            {#each plugin.featnote
                .map((note) => featNotes[note])
                .filter((i) => i) as note}
                <p class="text-primary-400 flex my-2">
                    <svelte:component
                        this={note.icon}
                        class="mr-1 p-[2px] stroke-primary-500"
                    />
                    {note.text}
                </p>
            {/each}
        </div>
    {/if}

    <div class="flex items-center space-x-2">
        <SlideToggle
            name={plugin.id}
            type="checkbox"
            active="bg-primary-500"
            bind:checked={enabled}
            on:change={async (e) => {
                await toggleEnabled(e, plugin);
            }}
        />
        {#if enabled && plugin.config_settings && Object.keys(plugin.config_settings).length > 0}
            <button
                class="btn variant-filled-primary"
                on:click={() => (showSettings = !showSettings)}
                ><Settings /></button
            >
        {/if}
        {#if plugin.file}
            <button
                class="btn variant-filled-primary"
                on:click={async () => {
                    await removePlugin(plugin);
                }}
            >
                <Trash />
            </button>
        {/if}
    </div>

    {#if enabled && plugin.config_settings && pluginConf && showSettings}
        {#each Object.entries(plugin.config_settings) as [i, setting]}
            <Option key={i} i={setting} bind:value={pluginConf[i]} />
        {/each}
    {/if}
</div>
