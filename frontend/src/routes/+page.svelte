<script>
    import { GetOrCreateConfig, SaveConfig } from '$lib/wailsjs/go/main/App';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { onMount } from 'svelte';

    const toastStore = getToastStore();
    let loading = true;

    onMount(async () => {
        GetOrCreateConfig()
            .then((config) => {
                if (config.setup_done) {
                    return (window.location.href = '/home');
                }

                loading = false;
            })
            .catch((error) => {
                console.error(error);

                toastStore.trigger({
                    message: 'Failed to load config',
                    background: 'variant-filled-error'
                });
            });
    });

    async function finish() {
        SaveConfig({
            ...(await GetOrCreateConfig()),
            setup_done: true
        })
            .then(() => {
                toastStore.trigger({
                    message: 'Setup completed',
                    background: 'variant-filled-success'
                });

                window.location.href = '/home';
            })
            .catch((error) => {
                console.error(error);

                toastStore.trigger({
                    message: 'Failed to save config',
                    background: 'variant-filled-error'
                });
            });
    }
</script>

{#if loading}
    <h1 class="text-3xl">Loading</h1>
{:else}
    <h1 class="text-3xl">Setup</h1>
    <button class="btn variant-ghost">Skip</button>
    <button class="btn variant-filled-primary" on:click={finish}>Finish</button>
{/if}
