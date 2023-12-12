<script lang="ts">
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import { getOrCreateConfig, saveConfig } from '$lib/config';
    import { goto } from '$app/navigation';

    const toastStore = getToastStore();
    let loading = true;

    onMount(async () => {
        getOrCreateConfig()
            .then((config) => {
                if (config.setup_done) {
                    return goto('/home', { replaceState: true });
                }

                loading = false;
            })
            .catch((error) => {
                console.error(error);

                toastStore.trigger({
                    message: $_('config_load_fail'),
                    background: 'variant-filled-error'
                });
            });
    });

    async function finish() {
        saveConfig({
            ...(await getOrCreateConfig()),
            setup_done: true
        })
            .then(() => {
                toastStore.trigger({
                    message: $_('setup_done'),
                    background: 'variant-filled-success'
                });

                return goto('/home', { replaceState: true });
            })
            .catch((error) => {
                console.error(error);

                toastStore.trigger({
                    message: $_('config_save_fail'),
                    background: 'variant-filled-error'
                });
            });
    }
</script>

{#if loading}
    <h1 class="text-3xl">Loading</h1>
{:else}
    <h1 class="text-3xl">{$_('setup')}</h1>
    <button class="btn variant-ghost">{$_('skip')}</button>
    <button class="btn variant-filled-primary" on:click={finish}
        >{$_('finish')}</button
    >
{/if}
