<script lang="ts">
    import ImportDirectory from '$components/ImportDirectory.svelte';
    import { getLibrary } from '$lib/library';
    import { db, type FriendlyAlbum, type FriendlyTrack } from '$lib/db';
    import { playTrack } from '$src/lib/player';
    import { Avatar, getToastStore } from '@skeletonlabs/skeleton';
    import { onMount } from 'svelte';
    import { Loader2 } from 'lucide-svelte';

    const toastStore = getToastStore();
    let albums: FriendlyAlbum[] = [];
    let recentlyAdded: FriendlyTrack[] = [];
    let loading = true;

    onMount(async () => {
        try {
            recentlyAdded = (await getLibrary()).slice(0, 12);
            albums = await Promise.all(
                (
                    await db.albums.toArray()
                ).map(async (album) => await db.friendlyAlbum(album))
            );
            loading = false;
        } catch (e) {
            toastStore.trigger({
                message: `<h1 class="text-lg">Failed to load library</h1><p class="text-sm">${e}</p>`,
                background: 'variant-filled-error',
                autohide: false
            });
        }
    });
</script>

<div>
    <div class="flex justify-between">
        <h1 class="text-3xl mt-4 mb-8 justify-start">Good evening</h1>
        <ImportDirectory />
    </div>
    <div class="space-y-4">
        <h2 class="text-xl">Recently Added</h2>
        <div class="flex space-x-4 {!loading ? 'overflow-y-auto' : ''}">
            {#if loading}
                <Loader2 class="animate-spin " />
                <p>Updating your library...</p>
            {/if}
            {#each recentlyAdded as track}
                <div class="flex flex-col w-44">
                    <Avatar
                        on:click={() => playTrack(track)}
                        src={track.album.albumArt}
                        class="rounded-lg w-44 h-44 hover:brightness-90 hover:cursor-pointer mb-1"
                        initials={track.album?.name
                            .replace(' ', '')
                            .slice(0, 2)}
                    />
                    <h3
                        on:click={() => playTrack(track)}
                        class="text-sm hover:cursor-pointer hover:text-gray-200 line-clamp-1"
                    >
                        {track.title}
                    </h3>
                    <h4 class="text-xs line-clamp-1">
                        {track.artist?.name}
                    </h4>
                </div>
            {/each}
        </div>
        <h2 class="text-xl">Albums</h2>
        <div class="flex space-x-4 {!loading ? 'overflow-y-auto' : ''}">
            {#each albums as album}
                <div class="flex flex-col w-44">
                    <a href="/album?id={encodeURIComponent(album.id)}">
                        <Avatar
                            src={album.albumArt}
                            class="rounded-lg w-44 h-44 hover:brightness-90 hover:cursor-pointer mb-1"
                            initials={album.name.slice(0, 2)}
                        />

                        <h3
                            class="text-sm hover:cursor-pointer hover:text-gray-200 line-clamp-1"
                        >
                            {album.name}
                        </h3>
                    </a>
                </div>
            {/each}
        </div>
    </div>
</div>
