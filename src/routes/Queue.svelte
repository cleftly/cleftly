<script lang="ts">
    import { _ } from 'svelte-i18n';
    import { front, queue } from '$lib/stores';
    import TrackList from '$components/TrackList.svelte';
</script>

{#if $front.modal === 'queue'}
    <div
        class="overflow-y-auto p-4 bg-neutral-300 dark:bg-neutral-900 min-h-full"
    >
        <h3 class="text-2xl">{$_('queue')}</h3>
        {#if $queue.tracks.length > 0}
            <div class="mt-4">
                <TrackList
                    tracks={$queue.tracks.slice($queue.index)}
                    mode="albumArt"
                    resort={false}
                />
            </div>
        {:else}
            <p class="text-slate-400">{$_('queue_empty')}</p>
        {/if}
    </div>
{/if}
