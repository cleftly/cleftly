<script>
    import {
        GetOrCreateConfig,
        PickDirectory,
        SaveConfig
    } from '$lib/wailsjs/go/main/App';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { Plus } from 'lucide-svelte';

    const toastStore = getToastStore();

    export async function importDirectory() {
        const dir = await PickDirectory('Add directory');

        if (!dir) {
            return;
        }

        const config = await GetOrCreateConfig();

        if (config.music_directories?.includes(dir)) {
            toastStore.trigger({
                message: 'Directory already added!',
                background: 'variant-filled-warning'
            });
            return;
        }

        await SaveConfig({
            ...config,
            music_directories: [...(config.music_directories || []), dir]
        })
            .then(() => {
                toastStore.trigger({
                    message: 'Added directory',
                    background: 'variant-filled-success'
                });
            })
            .catch((err) => {
                console.error(err);
                toastStore.trigger({
                    message: 'Failed to add directory',
                    background: 'variant-filled-error'
                });
            });
    }
</script>

<button class="btn btn-sm variant-soft" on:click={importDirectory}
    ><Plus /> Add directory</button
>
