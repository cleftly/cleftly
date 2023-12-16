<script lang="ts">
    import {
        getModalStore,
        getToastStore,
        SlideToggle,
        type ModalSettings
    } from '@skeletonlabs/skeleton';
    import { Loader2, Trash } from 'lucide-svelte';
    import { onMount } from 'svelte';

    import { open } from '@tauri-apps/api/dialog';
    import { _ } from 'svelte-i18n';
    import LastFmLogin from './LastFmLogin.svelte';
    import db from '$lib/db';
    import { getOrCreateConfig, saveConfig, type Config } from '$lib/config';
    import {
        exportAndSaveAllPlaylists,
        selectAndImportPlaylists
    } from '$lib/playlists';
    import { front, playlists } from '$lib/stores';

    const toastStore = getToastStore();
    const modalStore = getModalStore();

    let oldConfig: Config | null = null;
    let config: Config | null = null;

    const SETTINGS = {
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
        },
        lyrics_save: {
            name: $_('setting_lyrics_auto_save'),
            description: $_('setting_lyrics_auto_save_desc'),
            type: 'bool'
        }

        // audio_backend: {
        //     name: 'Audio Backend',
        //     type: 'enum',
        //     options: [
        //         {
        //             label: 'Web',
        //             value: 'web'
        //         },
        //         {
        //             label: 'Native (Not Implemented)',
        //             value: 'native'
        //         }
        //     ]
        // }
    };

    onMount(async () => {
        getOrCreateConfig()
            .then((res) => {
                oldConfig = structuredClone(res);
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

    async function importDirectory() {
        const dir = await open({
            multiple: true,
            directory: true,
            recursive: true
        });

        if (!dir) {
            return;
        }

        const dirs = config['music_directories'];

        if (Array.isArray(dir)) {
            dirs.push(...dir);
        } else {
            dirs.push(dir);
        }

        config = { ...config, music_directories: dirs };
    }

    async function cancelChanges() {
        config = await getOrCreateConfig();
        oldConfig = structuredClone(config);
    }

    async function saveChanges() {
        if (!config) return;

        saveConfig(config)
            .then(() => {
                toastStore.trigger({
                    message: $_('changes_saved'),
                    background: 'variant-filled-success'
                });

                if (!config) return;

                front.set({
                    ...$front,
                    theme: config.theme,
                    color: config.color
                });

                oldConfig = structuredClone(config);
            })
            .catch((err) => {
                console.error(err);
                toastStore.trigger({
                    message: $_('changes_save_fail'),
                    background: 'variant-filled-error'
                });
            });
    }

    async function resetDB() {
        const pls = await db.playlists.toArray();

        await db.delete();
        await db.open();

        playlists.set([]);
        await db.playlists.bulkAdd(pls);

        toastStore.trigger({
            message: $_('database_was_reset'),
            background: 'variant-filled-success'
        });
    }

    const modal: ModalSettings = {
        type: 'confirm',
        // Data
        title: $_('reset_database'),
        body: $_('reset_database_confirmation'),
        response: (r: boolean) => {
            if (!r) return;

            // TODO: Export playlists

            resetDB().catch((err) => {
                console.error(err);

                toastStore.trigger({
                    message: `<h1 class="text-lg">${$_(
                        'reset_database_fail'
                    )}</h1><p class="text-sm">${err}</p>`,
                    background: 'variant-filled-error'
                });
            });
        }
    };
</script>

<div class="space-y-2">
    {#if config && oldConfig && JSON.stringify(config) !== JSON.stringify(oldConfig)}
        <aside class="alert variant-filled-warning">
            <div class="alert-message">
                <h3 class="text-xl">{$_('unsaved_changes')}</h3>
                <p>{$_('unsaved_changes_desc')}</p>
            </div>

            <div class="alert-actions">
                <button class="btn variant-ghost" on:click={cancelChanges}
                    >{$_('cancel')}</button
                >
                <button
                    class="btn variant-filled-primary"
                    on:click={saveChanges}>{$_('save_changes')}</button
                >
            </div>
        </aside>
    {/if}
    <h1 class="text-3xl">{$_('settings')}</h1>
    {#if config}
        {#each Object.entries(SETTINGS) as [k, i]}
            <div class="space-y-1">
                <h2 class="text-2xl">{i.name}</h2>
                {#if i.description}
                    <p class="text-slate-400 md:max-w-[75%]">{i.description}</p>
                {/if}
            </div>
            {#if i.type === 'string'}
                <input class="input p-1" type="text" bind:value={config[k]} />
            {:else if i.type === 'number'}
                <input class="input p-1" type="number" bind:value={config[k]} />
            {:else if i.type === 'bool'}
                <SlideToggle
                    name={k}
                    type="checkbox"
                    active="bg-primary-500"
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
                    {$_('add_directory')}
                </button>
            {:else if i.type === 'enum'}
                <select class="select w-full max-w-xs" bind:value={config[k]}>
                    {#each i.options as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            {:else}
                <p>{config[k]}</p>
            {/if}
        {/each}
        <div>
            <button class="mt-4 btn variant-ghost" on:click={cancelChanges}>
                {$_('cancel')}
            </button>
            <button class="btn variant-filled-primary" on:click={saveChanges}>
                {$_('save_changes')}
            </button>
        </div>
        <div>
            <h2 class="mt-8 mb-2 text-2xl">{$_('playlists')}</h2>
            <button
                class="btn variant-ghost"
                on:click={async () => {
                    selectAndImportPlaylists()
                        .then(() => {
                            toastStore.trigger({
                                message: $_('imported_playlists'),
                                background: 'variant-filled-success'
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            toastStore.trigger({
                                message: `<h1 class="text-lg">${$_(
                                    'imported_playlists_fail'
                                )}</h1><p class="text-sm">${err}</p>`,
                                background: 'variant-filled-error'
                            });
                        });
                }}>{$_('import_playlists')}</button
            >
            <button
                class="btn variant-ghost"
                on:click={async () => {
                    exportAndSaveAllPlaylists()
                        .then(() => {
                            toastStore.trigger({
                                message: $_('exported_playlists'),
                                background: 'variant-filled-success'
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            toastStore.trigger({
                                message: `<h1 class="text-lg">${$_(
                                    'exported_playlists_fail'
                                )}</h1><p class="text-sm">${err}</p>`,
                                background: 'variant-filled-error'
                            });
                        });
                }}
            >
                {$_('export_playlists')}</button
            >
        </div>
        <div>
            <h6 class="mt-12 text-lg">{$_('having_issues')}</h6>
            <p class="text-md mb-2">
                {$_('reset_database_description')}
            </p>
            <button
                class="btn variant-ringed-primary"
                on:click={() => modalStore.trigger(modal)}
                >{$_('reset_database')}</button
            >
        </div>
        <div class="space-y-4">
            <h2 class="text-2xl mt-12 mb-2">{$_('integrations')}</h2>
            <div class="space-y-1">
                <h3 class="text-xl">{$_('lyrics')}</h3>
                <p class="text-slate-400">
                    {$_('musixmatch_details_p1')} <wbr />{$_(
                        'musixmatch_details_p2'
                    )}
                </p>
                <!-- TODO: Local save toggle-->
            </div>
            <div class="space-y-1">
                <h3 class="text-xl">Last.fm</h3>
                <LastFmLogin />
            </div>
            <div class="space-y-1">
                <h3 class="text-xl">{$_('discord_rpc')}</h3>
                <p class="text-slate-400">
                    {$_('discord_rpc_details')}
                </p>
                <p>TODO</p>
            </div>
        </div>
    {:else}
        <Loader2 class="animate-spin " />
    {/if}
</div>
