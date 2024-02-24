<script lang="ts">
    import { Play } from 'lucide-svelte';

    import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
    import type { FriendlyTrack } from '$lib/db';
    import { playTrack } from '$lib/player';
    import { audio } from '$lib/stores';
    import { getTimestamp } from '$lib/utils';
    import { openTrackMenu } from '$lib/menus';

    const toastStore = getToastStore();
    const modalStore = getModalStore();

    $: sortedTracks = resort
        ? tracks.sort((a, b) =>
              a.discNum === b.discNum
                  ? a.trackNum - b.trackNum
                  : a.discNum - b.discNum
          )
        : tracks;

    export let resort: boolean = true;
    export let tracks: FriendlyTrack[] = [];
    export let mode: 'number' | 'albumArt' = 'number';
    export let playMode: 'button' | 'click' = 'button';
    export let queueTracks: boolean = true;
</script>

<dl class="space-y-2">
    {#each sortedTracks as track, i}
        <div
            class="flex flex-row rounded-xl items-center p-2 group {i % 2 === 0
                ? 'bg-neutral-300 dark:bg-neutral-900'
                : ''} hover:!bg-primary-500 hover:cursor-pointer"
            on:click={() => {
                if (playMode === 'click') {
                    playTrack(track, queueTracks ? tracks : undefined);
                }
            }}
            on:keydown={() => {
                if (playMode === 'click') {
                    playTrack(track, queueTracks ? tracks : undefined);
                }
            }}
            on:contextmenu={(e) =>
                openTrackMenu(e, track, modalStore, toastStore)}
            role="button"
            tabindex="0"
        >
            <div>
                {#if playMode === 'button'}
                    <button
                        class="btn btn-sm hidden group-hover:block hover:variant-ghost w-10 mr-2 justify-center items-center"
                        on:click={() => playTrack(track, tracks)}
                    >
                        <div class="flex justify-center items-center">
                            <Play class="fill-white w-6 h-6" />
                        </div>
                    </button>
                {/if}
                <button
                    class="btn btn-sm block {playMode === 'button'
                        ? 'group-hover:hidden '
                        : ''} w-10 {mode !== 'number' ? 'p-0' : ''} mr-2"
                >
                    {#if track.id === $audio?.track.id}
                        <!-- <Visualizer /> -->
                    {:else if mode === 'number'}
                        <p
                            class={track.id === $audio?.track.id
                                ? 'animate-pulse'
                                : ''}
                        >
                            {track.trackNum}
                        </p>
                    {:else}
                        <img
                            src={track.album.albumArt}
                            alt="Album Art"
                            class="w-10 h-10 rounded-lg"
                        />
                    {/if}
                </button>
            </div>

            <span class="flex-auto line-clamp-4">
                <dt class="line-clamp-3">{track.title}</dt>
                <dd>{track.artist.name}</dd>
            </span>
            <span class="justify-end items-center text-sm text-gray-400 mr-2">
                {getTimestamp(track.duration)}
            </span>
        </div>
    {/each}
</dl>
