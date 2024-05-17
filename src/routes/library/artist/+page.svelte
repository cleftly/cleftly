<script lang="ts">
    import { Play, Shuffle } from 'lucide-svelte';
    import { _ } from 'svelte-i18n';
    import Album from '$components/Album.svelte';
    import { playTrack } from '$lib/player.js';

    $: artist = data.artist;
    // Sum of all track durations > 30 or > 6 songs
    $: albums = data.albums
        ?.filter(
            (a) =>
                a.tracks.length > 6 ||
                a.tracks.reduce((sum, t) => sum + t.duration, 0) >= 30 * 60
        )
        .sort((a, b) => (b.year || 0) - (a.year || 0));

    $: singles = data.albums
        ?.filter(
            (a) =>
                a.tracks.length <= 6 &&
                a.tracks.reduce((sum, t) => sum + t.duration, 0) < 30 * 60
        )
        .sort((a, b) => (b.year || 0) - (a.year || 0));
    $: tracks = data.tracks;

    export let data;
</script>

{#if artist}
    <div class="flex md:flex-row flex-col mb-0">
        <!-- <Avatar
                src={playlist.albumArt}
                class="rounded-lg w-72 h-72 mb-1 justify-center items-center md:justify-normal"
            /> -->
        <div class="flex m-4 mb-0 items-end">
            <div class="space-x-2">
                <h1 class="mx-2 text-3xl mt-4">{artist.name}</h1>
                <p class="mb-2 text-sm line-clamp-2 text-gray-400">
                    {tracks?.length || 0} track{tracks?.length !== 1 ? 's' : ''}
                    · {albums?.length || 0} album{albums?.length !== 1
                        ? 's'
                        : ''}
                </p>
                {#if tracks && tracks.length > 0}
                    <div class="mx2 space-x-1">
                        <button
                            class="btn btn-sm variant-filled-primary"
                            on:click={() =>
                                playTrack(tracks[0], tracks, undefined, true)}
                        >
                            <Play class="fill-white mr-2" />
                            {$_('play')}
                        </button>
                        <button
                            class="btn btn-sm variant-filled-primary"
                            on:click={() =>
                                playTrack(
                                    tracks[
                                        Math.floor(
                                            Math.random() * tracks.length
                                        )
                                    ],
                                    tracks,
                                    undefined,
                                    true
                                )}
                        >
                            <Shuffle class="mr-2" />
                            {$_('shuffle')}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
    <div class="ml-4 space-y-4">
        {#if albums && albums?.length > 0}
            <div class="space-y-2">
                <h2 class="text-xl">{$_('albums')}</h2>
                <div class="flex space-x-4 overflow-y-auto">
                    {#each albums as album}
                        <Album titleClamp={2} subtitle="year" {album} />
                    {/each}
                </div>
            </div>
        {/if}
        {#if singles && singles?.length > 0}
            <div class="space-y-2">
                <h2 class="text-xl">{$_('singles_ep')}</h2>
                <div class="flex space-x-4 overflow-y-auto">
                    {#each singles as single}
                        <Album titleClamp={2} subtitle="year" album={single} />
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}
