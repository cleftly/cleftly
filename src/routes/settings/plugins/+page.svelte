<script lang="ts">
    import { SlideToggle } from '@skeletonlabs/skeleton';
    import { Settings } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import { getOrCreateConfig } from '$lib/config';

    let enabledPlugins: string[] = [];

    let plugins: {
        id: string;
        name?: string;
        description?: string;
        enabled: boolean;
        file?: string;
    }[];

    $: enabledPlugins,
        (plugins = [
            {
                id: 'com.cleftly.discordrpc',
                name: 'Discord RPC',
                description: $_('discord_rpc_details'),
                enabled: enabledPlugins.includes('com.cleftly.discordrpc')
            }
        ]);

    onMount(async () => {
        enabledPlugins = (await getOrCreateConfig()).enabled_plugins;
    });

    async function toggleEnabled(
        e: InputEvent,
        plugin: (typeof plugins)[number]
    ) {
        // @ts-expect-error Weird typing
        const enabled = e.target?.checked;

        enabled;
        plugin;
        // TODO: Add to enabledPlugins in config and show "reload to apply" alert
    }
</script>

<div class="space-y-2">
    <h1 class="text-3xl">{$_('plugins')}</h1>

    <h2 class="text-xl">
        {$_('built_in')}
    </h2>

    {#each plugins.filter((e) => !e.file) as plugin}
        <div class="card p-4 rounded-xl space-y-2">
            <h3 class="text-xl">{plugin.name || plugin.id}</h3>
            <p class="text-slate-400">
                {plugin.description ||
                    'This plugin must run at least once to show its metadata.'}
            </p>
            <div class="flex items-center space-x-2">
                <SlideToggle
                    name={plugin.id}
                    type="checkbox"
                    active="bg-primary-500"
                    on:change={async (e) => {
                        await toggleEnabled(e, plugin);
                    }}
                />
                {#if plugin.enabled}
                    <button class="btn variant-filled-primary"
                        ><Settings /></button
                    >
                {/if}
            </div>
        </div>
    {/each}

    <h2 class="text-xl">
        {$_('third_party')}
    </h2>
</div>
