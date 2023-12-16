<script lang="ts">
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { Loader2 } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import db, {
        type FriendlyAlbum,
        type FriendlyPlaylist,
        type FriendlyTrack
    } from '$lib/db';
    import { friendlyLibrary, updateLibrary } from '$lib/library';
    import CreatePlaylist from '$components/CreatePlaylist.svelte';
    import Album from '$components/Album.svelte';
    import Track from '$components/Track.svelte';
    import Playlist from '$components/Playlist.svelte';

    const toastStore = getToastStore();
    let albums: FriendlyAlbum[] = [];
    let playlists: FriendlyPlaylist[] = [];
    let recentlyPlayed: FriendlyTrack[] = [];
    let recentlyAdded: FriendlyTrack[] = [];
    let loading = true;

    async function getThings() {
        recentlyAdded = await friendlyLibrary(
            await db.tracks.orderBy('createdAt').reverse().limit(16).toArray()
        );
        recentlyPlayed = await friendlyLibrary(
            await db.tracks
                .orderBy('lastPlayedAt')
                .reverse()
                .limit(16)
                .toArray()
        );

        albums = await Promise.all(
            (
                await db.albums
                    .orderBy('createdAt')
                    .reverse()
                    .limit(16)
                    .toArray()
            ).map(async (album) => await db.friendlyAlbum(album))
        );
        playlists = await Promise.all(
            (
                await db.playlists
                    .orderBy('createdAt')
                    .reverse()
                    .limit(16)
                    .toArray()
            ).map(async (playlist) => await db.friendlyPlaylist(playlist))
        );
    }

    onMount(async () => {
        try {
            await updateLibrary();
            await getThings();
            loading = false;
        } catch (e) {
            toastStore.trigger({
                message: `<h1 class="text-lg">${$_(
                    'library_load_fail'
                )}</h1><p class="text-sm">${e}</p>`,
                background: 'variant-filled-error',
                autohide: false
            });
        }
    });
</script>

<div>
    <div class="flex justify-between">
        <h1 class="text-3xl mt-4 mb-8 justify-start">
            {new Date().getHours() < 12
                ? $_('good_morning')
                : new Date().getHours() < 18
                ? $_('good_afternoon')
                : $_('good_evening')}
        </h1>
        <CreatePlaylist />
    </div>
    <div class="space-y-4">
        <h2 class="text-xl">{$_('recently_played')}</h2>
        <div class="flex space-x-4 {!loading ? 'overflow-y-auto' : ''}">
            {#if loading}
                <Loader2 class="animate-spin " />
                <p>{$_('updating_your_library')}...</p>
            {/if}
            {#each recentlyPlayed as track}
                <Track {track} titleClamp={1} view="artist" />
            {/each}
            {#if !loading && recentlyPlayed.length === 0}
                <p>{$_('no_recently_played')}</p>
            {/if}
        </div>
        <h2 class="text-xl">{$_('recently_added')}</h2>
        <div class="flex space-x-4 {!loading ? 'overflow-y-auto' : ''}">
            {#if loading}
                <Loader2 class="animate-spin " />
                <p>{$_('updating_your_library')}...</p>
            {/if}
            {#each recentlyAdded as track}
                <Track {track} titleClamp={1} view="artist" />
            {/each}
        </div>
        <h2 class="text-xl">{$_('albums')}</h2>
        <div class="flex space-x-4 {!loading ? 'overflow-y-auto' : ''}">
            {#if loading}
                <Loader2 class="animate-spin " />
                <p>{$_('updating_your_library')}...</p>
            {/if}
            {#each albums as album}
                <Album titleClamp={1} {album} />
            {/each}
        </div>
        <h2 class="text-xl">{$_('playlists')}</h2>
        <div class="flex space-x-4 {!loading ? 'overflow-y-auto' : ''}">
            {#if loading}
                <Loader2 class="animate-spin " />
                <p>{$_('updating_your_library')}...</p>
            {/if}
            {#each playlists as playlist}
                <Playlist titleClamp={1} {playlist} />
            {/each}
        </div>

        <h2 class="text-xl">{$_('artists')}</h2>
    </div>
</div>
