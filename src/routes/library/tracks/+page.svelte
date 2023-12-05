<script>
    import { _ } from 'svelte-i18n';
    import Track from '$components/Track.svelte';

    $: tracks = data.tracks;

    export let data;
</script>

{#if tracks}
    <h1 class="text-3xl mt-4 mb-8 justify-start">{$_('songs')}</h1>
    <div class="flex flex-wrap justify-start gap-4">
        {#each tracks as track}
            <Track {track} classes="mr-2" />
        {/each}
    </div>
{/if}
