<script lang="ts">
    import '../app.css';
    import {
        AppShell,
        Avatar,
        ProgressBar,
        RangeSlider,
        Toast
    } from '@skeletonlabs/skeleton';
    import { afterNavigate } from '$app/navigation';
    import {
        Home,
        Pause,
        Play,
        Repeat,
        Shuffle,
        StepBack,
        StepForward,
        TextSelect
    } from 'lucide-svelte';

    // Scroll to the top on navigation
    afterNavigate((params: any) => {
        const isNewPage: boolean =
            params.from &&
            params.to &&
            params.from.route.id !== params.to.route.id;
        const elemPage = document.querySelector('#page');
        if (isNewPage && elemPage !== null) {
            elemPage.scrollTop = 0;
        }
    });

    import type { ComponentEvents } from 'svelte';

    function goBack() {
        window.history.back();
    }

    function goForward() {
        window.history.forward();
    }

    import { initializeStores } from '@skeletonlabs/skeleton';
    import Player from './Player.svelte';

    initializeStores();
</script>

<Toast />

<AppShell scrollbarGutter="auto">
    <svelte:fragment slot="header">
        <nav
            class="px-[4.75rem] navbar h-11 bg-neutral-900 flex w-full"
            style="--wails-draggable:drag"
        >
            <div class="flex w-1/4">
                <!-- Back button-->
                <button on:click={goBack} class="btn btn-sm variant-soft">
                    &lt;
                </button>
                <button on:click={goForward} class="btn btn-sm variant-soft">
                    &gt;
                </button>
            </div>
            <div class="flex w-2/4 items-center justify-center">
                <input
                    class="input rounded-lg p-1"
                    type="text"
                    placeholder="Search"
                />
            </div>
        </nav>
    </svelte:fragment>
    <svelte:fragment slot="sidebarLeft">
        <div class="bg-neutral-900 h-full w-[12rem]">
            <nav class="list-nav text-sm">
                <ul>
                    <li><a href="/home"><Home class="mr-2" /> Home</a></li>
                    <li><a href="/settings">Settings</a></li>
                </ul>
            </nav>
        </div>
    </svelte:fragment>
    <div class="container mx-auto p-8 space-y-8">
        <slot />
    </div>
    <svelte:fragment slot="footer">
        <Player />
    </svelte:fragment>
</AppShell>
