<script>
    import { Avatar, ProgressBar, RangeSlider } from '@skeletonlabs/skeleton';
    import {
        Shuffle,
        StepBack,
        Pause,
        StepForward,
        Repeat,
        TextSelect,
        Play
    } from 'lucide-svelte';
    import { audio } from '$lib/stores';

    import { onMount } from 'svelte';
    import { getTimestamp } from '$lib/utils';

    onMount(() => {
        // Every 1 second log $audio
        setInterval(() => {
            console.log($audio);
        }, 1000);
    });

    let play;
</script>

{#if $audio}
    <audio
        src={$audio.src}
        class="hidden"
        autoplay
        bind:paused={$audio.paused}
        bind:muted={$audio.muted}
        bind:currentTime={$audio.currentTime}
        bind:duration={$audio.duration}
        bind:volume={$audio.volume}
        bind:this={play}
    />

    <div class="flex bg-neutral-900 h-[5.5rem] overflow-hidden w-full">
        <div class="w-1/4 flex items-center space-x-2 ml-2">
            <img
                src={$audio.metadata?.albumArt}
                class="w-[4.5rem] h-[4.5rem] rounded-lg"
                alt="Album Art"
            />
            <div class="items-center">
                <h1 class="text-md">{$audio.metadata?.title || 'Unknown'}</h1>
                <h2 class="text-sm">
                    {$audio.metadata?.album ||
                        $audio.metadata?.title ||
                        'Unknown'} - {$audio.metadata?.artist || 'Unknown'}
                </h2>
            </div>
        </div>
        <div
            class="w-2/4 flex flex-col items-center space-y-4 mx-4 justify-center"
        >
            <div class="flex items-center space-x-4 w-full">
                <p class="text-xs">{getTimestamp($audio.currentTime)}</p>

                <RangeSlider
                    name="currentTime"
                    accent="variant-filled-primary"
                    class="w-full"
                    bind:value={$audio.currentTime}
                    max={Math.floor($audio.duration)}
                    step={1}
                />
                <p class="text-xs">{getTimestamp($audio.duration)}</p>
            </div>
            <div class="flex items-center space-x-2">
                <button class="btn btn-sm variant-soft w-4 h-4 p-0">
                    <Shuffle />
                </button>
                <button class="btn btn-sm variant-soft w-6 h-6 p-0">
                    <StepBack />
                </button>
                <button
                    class="btn btn-sm variant-soft w-6 h-6 p-0"
                    on:click={() => ($audio.paused = !$audio.paused)}
                >
                    {#if $audio.paused}
                        <Play />
                    {:else}
                        <Pause />
                    {/if}
                </button>
                <button class="btn btn-sm variant-soft w-6 h-6 p-0">
                    <StepForward />
                </button>
                <button class="btn btn-sm variant-soft w-4 h-4 p-0">
                    <Repeat />
                </button>
            </div>
        </div>
        <div class="w-1/4 flex items-center space-x-4 mr-8 justify-end">
            <RangeSlider
                name="volume"
                bind:value={$audio.volume}
                min={0}
                max={1}
                step={0.01}
            />
            <button class="btn btn-sm variant-soft w-6 h-6 p-0">
                <TextSelect />
            </button>
        </div>
    </div>
{/if}
