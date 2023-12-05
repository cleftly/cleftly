<script lang="ts">
    import { Play, Shuffle, Trash } from 'lucide-svelte';

    import { _ } from 'svelte-i18n';
    import { goto } from '$app/navigation';
    import TrackList from '$components/TrackList.svelte';
    import db from '$lib/db';
    import { playTrack } from '$lib/player';

    $: playlist = data.playlist;

    export let data;

    async function deletePlaylist() {
        if (!playlist) return;

        await db.playlists.delete(playlist.id);
        goto('/home');
    }
</script>

{#if playlist}
    <div>
        <div class="flex md:flex-row flex-col w-full">
            <!-- <Avatar
                src={playlist.albumArt}
                class="rounded-lg w-72 h-72 mb-1 justify-center items-center md:justify-normal"
            /> -->
            <div class="flex m-4 items-end">
                <div class="space-x-2">
                    <h1 class="mx-2 text-3xl mt-4">{playlist.name}</h1>
                    <a
                        class="!mx-0 p-2 btn bg-transparent hover:variant-ghost text-xl"
                        href="/home"
                    >
                        {$_('you')}
                    </a>
                    <p class="mb-2 text-sm line-clamp-2 text-gray-400">
                        {playlist.trackIds.length} track{playlist.trackIds
                            .length !== 1
                            ? 's'
                            : ''}
                    </p>
                    <div class="mx2 space-x-1">
                        <button
                            class="btn btn-sm variant-filled-primary"
                            on:click={() =>
                                playTrack(playlist.tracks[0], playlist.tracks)}
                        >
                            <Play class="fill-white mr-2" />
                            {$_('play')}
                        </button>
                        <!-- TODO -->
                        <button
                            class="btn btn-sm variant-filled-primary"
                            on:click={() =>
                                playTrack(playlist.tracks[0], playlist.tracks)}
                        >
                            <Shuffle class="mr-2" />
                            {$_('shuffle')}
                        </button>
                        <button
                            class="btn btn-sm variant-filled-primary"
                            on:click={deletePlaylist}
                        >
                            <Trash /></button
                        >
                    </div>
                    <!--TODO-->
                </div>
            </div>
        </div>
        <TrackList tracks={playlist.tracks} mode="albumArt" />
    </div>
{/if}
