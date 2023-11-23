<script lang="ts">
    import { popup, type PopupSettings } from '@skeletonlabs/skeleton';
    import { ListMusic, TextSelect } from 'lucide-svelte';
    import { parse } from '$lib/lrcutils';
    import { queue } from '$lib/stores';
    import TrackList from '$components/TrackList.svelte';
    import { _ } from 'svelte-i18n';

    const queuePopup: PopupSettings = {
        event: 'click',
        target: 'queuePopup',
        placement: 'top-end'
    };
</script>

<div
    data-popup="queuePopup"
    class="w-72 h-[calc(100vh-4.75rem-3rem)] overflow-y-auto card p-4"
>
    <h3 class="text-2xl">{$_('queue')}</h3>
    {#if $queue.tracks.length > 0}
        <TrackList tracks={$queue.tracks.slice($queue.index)} mode="albumArt" />
    {:else}
        <p class="text-slate-400">{$_('queue_empty')}</p>
    {/if}
</div>

<button class="btn btn-sm variant-soft w-6 h-6 p-0" use:popup={queuePopup}>
    <ListMusic />
</button>
