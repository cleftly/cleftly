<script lang="ts">
    import '../app.css';
    import {
        computePosition,
        autoUpdate,
        offset,
        shift,
        flip,
        arrow
    } from '@floating-ui/dom';
    import {
        AppShell,
        Modal,
        Toast,
        initializeStores,
        storePopup
    } from '@skeletonlabs/skeleton';
    import { RotateCw } from 'lucide-svelte';
    import type { AfterNavigate } from '@sveltejs/kit';
    import { onMount } from 'svelte';
    import Player from './Player.svelte';
    import Sidebar from './Sidebar.svelte';
    import MobileNav from './MobileNav.svelte';
    import Lyrics from './Lyrics.svelte';
    import Queue from './Queue.svelte';
    import PlayerSettings from './PlayerSettings.svelte';
    import { afterNavigate, onNavigate } from '$app/navigation';
    import db from '$lib/db';
    import { front, playlists } from '$lib/stores';
    import Search from '$components/Search.svelte';
    import Progress from '$components/Progress.svelte';
    import i18n_init from '$lib/i18n';
    import { loadPlugins } from '$lib/plugins';
    import { getOrCreateConfig } from '$lib/config';
    // Locales

    i18n_init();
    initializeStores();

    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

    // Scroll to the top on navigation
    afterNavigate((params: AfterNavigate) => {
        const isNewPage: boolean = Boolean(
            params.from &&
                params.to &&
                params.from.route.id !== params.to.route.id
        );

        const elemPage = document.querySelector('#page');

        if (isNewPage && elemPage !== null) {
            elemPage.scrollTop = 0;
        }
    });

    $: if (process.browser)
        document.body.setAttribute('data-theme', $front.theme);
    $: if (process.browser)
        document.documentElement.classList.toggle(
            'dark',
            $front.color !== 'light'
        );
    $: if (process.browser)
        document.documentElement.classList.toggle(
            'oled',
            $front.color === 'oled'
        );

    onMount(async () => {
        playlists.set(
            await db.playlists.orderBy('updatedAt').reverse().toArray()
        );

        loadPlugins().then(() => {
            console.info('Plugins loaded');
        });

        const config = await getOrCreateConfig();

        front.set({
            ...$front,
            theme: config.theme,
            color: config.color
        });
    });

    /* View transition (Chromium only for now :/) */
    onNavigate((navigation) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });

    let doRerender = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const forceUpdate = async (_: unknown) => {};

    function goBack() {
        window.history.back();
    }

    function goForward() {
        window.history.forward();
    }

    async function reload() {
        doRerender++;
    }

    // Global shortcuts
    window.addEventListener('keydown', (e) => {
        // Ctrl + R - Reload
        if (e.ctrlKey && e.key === 'r') {
            reload();
        }
        // Ctrl + Shift + R - Full reload
        else if (e.ctrlKey && e.key === 'R') {
            window.location.reload();
        }
    });
</script>

<Modal />
<Toast position="tr" />

<AppShell scrollbarGutter="auto">
    <svelte:fragment slot="header">
        <nav
            class="{import.meta.env.TAURI_PLATFORM === 'darwin'
                ? 'pl-[4.75rem] pr-4'
                : 'px-4'} navbar h-11 bg-neutral-300 dark:bg-neutral-900 flex w-full select-none"
            data-tauri-drag-region={true}
        >
            <div class="flex w-1/4" data-tauri-drag-region={true}>
                <button
                    on:click={goBack}
                    class="btn btn-sm variant-soft !bg-transparent"
                >
                    &lt;
                </button>
                <button
                    on:click={goForward}
                    class="btn btn-sm variant-soft !bg-transparent"
                >
                    &gt;
                </button>
                <button
                    on:click={reload}
                    class="btn btn-sm variant-soft !bg-transparent"
                >
                    <RotateCw class="p-1" />
                </button>
            </div>
            <Search />
            <Progress />
        </nav>
    </svelte:fragment>
    <svelte:fragment slot="sidebarLeft">
        <div class="xs:showme h-full">
            <Sidebar />
        </div>
    </svelte:fragment>
    <div class="container mx-auto p-8 space-y-8">
        <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
        {#await forceUpdate(doRerender) then _}
            <slot />
        {/await}
    </div>
    <svelte:fragment slot="sidebarRight">
        <div class="max-w-[14rem] lg:max-w-[18rem] min-h-full">
            <Lyrics />
            <Queue />
            <PlayerSettings />
        </div>
    </svelte:fragment>
    <svelte:fragment slot="footer">
        <Player />
        <div class="xs:hidden">
            <MobileNav />
        </div>
    </svelte:fragment>
</AppShell>

<style>
    @media (min-width: 512px) {
        .xs\:hidden {
            display: none;
        }
    }

    @media (max-width: 512px) {
        .xs\:showme {
            display: none;
        }
    }
</style>
