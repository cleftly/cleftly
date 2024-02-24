<script lang="ts">
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import Option from './settings/Option.svelte';
    import { goto } from '$app/navigation';
    import { getOrCreateConfig, saveConfig, type Config } from '$lib/config';
    import { front } from '$lib/stores';
    import init_i18n from '$lib/i18n';

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

    let config: Config | null = null;

    let SETTINGS;

    function setSettings() {
        SETTINGS = {
            lang: {
                name: $_('setting_language'),
                description: $_('setting_needs_reload'),
                type: 'enum',
                options: [
                    {
                        label: $_('settings_language_system_default'),
                        value: null
                    },

                    {
                        label: 'English',
                        value: 'en'
                    },
                    {
                        label: 'Español',
                        value: 'es'
                    }
                ],
                onChange: () => {
                    saveChanges().then(() => {
                        init_i18n().then(() => {
                            setSettings();
                        });
                    });
                }
            },
            color: {
                name: $_('setting_color'),
                description: $_('setting_color_desc'),
                type: 'enum',
                options: [
                    {
                        label: $_('color_light'),
                        value: 'light'
                    },
                    {
                        label: $_('color_dark'),
                        value: 'dark'
                    },
                    {
                        label: $_('thing_is_beta', {
                            values: {
                                thing: 'OLED' // TODO: Does this need i18n?,
                            }
                        }),
                        value: 'oled'
                    }
                ]
            },
            theme: {
                name: $_('setting_theme'),
                description: $_('setting_theme_desc'),
                type: 'enum',
                options: [
                    {
                        label: $_('thing_is_default', {
                            values: {
                                thing: $_('theme_crimson')
                            }
                        }),
                        value: 'crimson'
                    },
                    {
                        label: $_('theme_skeleton'),
                        value: 'skeleton'
                    },
                    {
                        label: $_('theme_gold_nouveau'),
                        value: 'gold-nouveau'
                    },
                    {
                        label: $_('theme_modern'),
                        value: 'modern'
                    },
                    {
                        label: $_('theme_pink'),
                        value: 'pink'
                    }
                ]
            },
            music_directories: {
                name: $_('setting_music_dir'),
                description: $_('setting_music_dir_desc'),
                type: 'dirs'
            }
        };
    }

    setSettings();

    onMount(async () => {
        getOrCreateConfig()
            .then((res) => {
                config = structuredClone(res);
            })
            .catch((err) => {
                console.error(err);
                toastStore.trigger({
                    message: $_('config_load_fail'),
                    background: 'variant-filled-error'
                });
            });
    });

    async function saveChanges() {
        if (!config) return;

        saveConfig(config)
            .then(() => {
                if (!config) return;

                front.set({
                    ...$front,
                    theme: config.theme,
                    color: config.color
                });
            })
            .catch((err) => {
                console.error(err);
                toastStore.trigger({
                    message: $_('changes_save_fail'),
                    background: 'variant-filled-error'
                });
            });
    }

    $: config, saveChanges();
</script>

{#if loading || !config || !SETTINGS}
    <h1 class="text-3xl">Loading</h1>
{:else}
    <h1 class="text-3xl">{$_('setup')}</h1>
    {#each Object.entries(SETTINGS) as [k, i]}
        <Option key={k} bind:value={config[k]} {i} />
    {/each}
    <br />
    <button
        class="btn variant-ghost"
        on:click={() => {
            goto('/home', { replaceState: true });
        }}>{$_('skip')}</button
    >
    <button class="btn variant-filled-primary" on:click={finish}
        >{$_('finish')}</button
    >
{/if}
