<script lang="ts">
    import { SlideToggle } from '@skeletonlabs/skeleton';
    import { Settings, Trash } from 'lucide-svelte';
    import type { PluginInfo } from '$lib/plugins';
    import { getOrCreateConfig, saveConfig } from '$lib/config';

    interface ExternalPluginInfo extends PluginInfo {
        file: string;
    }

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
            plugins: conf.plugins.filter((p) => p !== plugin.file),
            enabled_plugins: conf.enabled_plugins.filter((p) => p !== plugin.id)
        });

        enabledPlugins = (await getOrCreateConfig()).enabled_plugins || [];

        refreshList();
    }

    export let plugin: PluginInfo | ExternalPluginInfo;
    export let enabled: boolean;
    export let enabledPlugins: string[];
    export let refreshList: () => Promise<void>;
</script>

<div class="card p-4 rounded-xl space-y-2">
    <div>
        <h3 class="text-xl">{plugin.name || plugin.id}</h3>
        <h4 class="text text-slate-400">Version {plugin.version}</h4>
        <h4 class="text text-slate-400">By {plugin.author}</h4>
    </div>

    <p class="text-slate-400">
        {plugin.description || 'No description provided.'}
    </p>
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
        {#if enabled}
            <button class="btn variant-filled-primary"><Settings /></button>
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
</div>
