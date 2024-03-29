<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import { Play, Shuffle } from 'lucide-svelte';
    import { _ } from 'svelte-i18n';
    import TrackList from '$components/TrackList.svelte';
    import { playTrack } from '$lib/player';

    $: album = data.album;
    $: tracks = data.tracks;

    export let data;
</script>

{#if album}
    <div>
        <div class="flex md:flex-row flex-col w-full">
            <div class="w-72 h-72">
                <Avatar
                    src={album.albumArt}
                    class="rounded-lg w-72 h-72 mb-1 justify-center items-center md:justify-normal"
                />
            </div>
            <div class="flex m-4 items-end">
                <div class="space-x-2">
                    <h1 class="mx-2 text-3xl mt-4">{album.name}</h1>
                    <a
                        class="!mx-0 p-2 btn bg-transparent hover:variant-ghost text-xl"
                        href="/library/artist?id={encodeURIComponent(
                            album.artist.id
                        )}"
                    >
                        {album.artist.name}
                    </a>
                    <p class="mb-2 text-sm line-clamp-2 text-gray-400">
                        {album.genres.length > 0 ? `${album.genres[0]}` : ''}
                        {album.genres.length > 0 && album.year ? ' · ' : ''}
                        {album.year ? `${album.year}` : ''}
                    </p>
                    <div class="mx2 space-x-1">
                        <button
                            class="btn btn-sm variant-filled-primary"
                            on:click={() => playTrack(tracks[0], tracks)}
                        >
                            <Play class="fill-white mr-2" />
                            {$_('play')}
                        </button>
                        <!-- TODO -->
                        <button
                            class="btn btn-sm variant-filled-primary"
                            on:click={() =>
                                playTrack(tracks[0], tracks, undefined, true)}
                        >
                            <Shuffle class="mr-2" />
                            {$_('shuffle')}
                        </button>
                    </div>
                    <!--TODO-->
                </div>
            </div>
        </div>
        <div class="mt-8">
            <TrackList {tracks} />
        </div>
    </div>
{/if}
