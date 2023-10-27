<script lang="ts">
    import db from '$src/lib/db';
    import {
        GetOrCreateConfig,
        type Config,
        PickDirectory,
        SaveConfig
    } from '$src/lib/wailsjs/go/main/App';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { Loader2, Trash } from 'lucide-svelte';
    import { onMount } from 'svelte';

    const toastStore = getToastStore();

    let config: Config | null = null;

    const SETTINGS = {
        music_directories: {
            name: 'Music Directories',
            type: 'dirs'
        }
    };

    onMount(async () => {
        config = await GetOrCreateConfig().catch((err) => {
            console.error(err);
            toastStore.trigger({
                message: 'Failed to load config',
                background: 'variant-filled-error'
            });
        });
    });

    async function importDirectory() {
        const dir = await PickDirectory('Add directory');

        if (!dir) {
            return;
        }

        const dirs = config['music_directories'];

        dirs.push(dir);

        config = { ...config, music_directories: dirs };
    }

    async function cancelChanges() {
        config = await GetOrCreateConfig();
        window.history.back();
    }

    async function saveChanges() {
        SaveConfig(config)
            .then(() => {
                toastStore.trigger({
                    message: 'Changes saved',
                    background: 'variant-filled-success'
                });
            })
            .catch((err) => {
                console.error(err);
                toastStore.trigger({
                    message: 'Failed to save changes',
                    background: 'variant-filled-error'
                });
            });
    }

    async function resetDB() {
        await db.delete();
        await db.open();
        toastStore.trigger({
            message: 'Database reset',
            background: 'variant-filled-success'
        });
    }
</script>

<div class="space-y-2">
    <h1 class="text-3xl">Settings</h1>
    {#if config}
        {#each Object.entries(SETTINGS) as [k, i]}
            <h2 class="text-2xl">{i.name}</h2>
            {#if i.type === 'string'}
                <input class="input p-1" type="text" bind:value={config[k]} />
            {:else if i.type === 'number'}
                <input class="input p-1" type="number" bind:value={config[k]} />
            {:else if i.type === 'bool'}
                <input
                    class="input p-1"
                    type="checkbox"
                    bind:checked={config[k]}
                />
            {:else if i.type === 'dirs'}
                {#each config[k] as item}
                    <div class="flex flex-row">
                        <p>{item}</p>
                        <button
                            class="btn variant-ghost-error"
                            on:click={() => {
                                const newConfig = { ...config };
                                newConfig[k] = config[k].filter(
                                    (i) => i !== item
                                );
                                config = newConfig;
                            }}
                        >
                            <Trash />
                        </button>
                    </div>
                {/each}
                <button
                    class="btn variant-ringed-primary"
                    on:click={importDirectory}
                >
                    i Add directory
                </button>
            {:else}
                <p>{config[k]}</p>
            {/if}
        {/each}
        <button class="btn variant-ghost" on:click={resetDB}
            >Reset Database</button
        >
        <div>
            <button class="btn variant-ghost" on:click={cancelChanges}>
                Cancel
            </button>
            <button class="btn variant-filled-primary" on:click={saveChanges}>
                Save Changes
            </button>
        </div>
    {:else}
        <Loader2 class="animate-spin " />
    {/if}
</div>
