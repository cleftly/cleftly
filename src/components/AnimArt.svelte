<script lang="ts">
    import { onMount } from 'svelte';
    import { Avatar } from '@skeletonlabs/skeleton';
    import type { Album, FriendlyAlbum } from '$lib/db';

    let animArtUrl: string | undefined;
    let prevAlbumId: string | undefined;
    let animArtElement: HTMLVideoElement | undefined;

    export let album: Album | FriendlyAlbum;
    export let size: string | number = '4.5rem';

    async function updateAnimatedArt() {
        if (album.id === prevAlbumId) return;

        prevAlbumId = album?.id;
        animArtUrl = undefined;

        if (!album?.animatedAlbumArt) return;

        const streamUrl = album?.animatedAlbumArt;

        // Convert to blob as streaming is broken on linux

        const blob = await fetch(streamUrl).then((res) => res.blob());

        animArtUrl = URL.createObjectURL(blob);
    }

    onMount(async () => {
        await updateAnimatedArt();
    });

    $: album, updateAnimatedArt();
</script>

<svelte:window
    on:blur={() => {
        if (animArtElement) {
            animArtElement.currentTime = 0;
            animArtElement.pause();
        }
    }}
    on:focus={() => {
        if (animArtElement) {
            animArtElement.currentTime = 0;
            animArtElement.play();
        }
    }}
/>

<div class="flex">
    <div class="object-fit relative" style="width: {size}; height: {size};">
        {#if animArtUrl}
            <video
                bind:this={animArtElement}
                src={animArtUrl}
                autoplay
                muted
                loop
                playsinline
                class="rounded-lg absolute z-10"
            />
        {/if}

        <Avatar
            src={album.albumArt}
            class="rounded-lg w-full h-full absolute"
        />
    </div>
</div>
