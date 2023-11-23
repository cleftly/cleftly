<script>
    import Track from '$components/Track.svelte';
    import { _ } from 'svelte-i18n';

    $: tracks = data.tracks;

    export let data;
</script>

<h1 class="text-3xl mt-4 mb-8 justify-start">{$_('songs')}</h1>
<div class="flex flex-wrap justify-start gap-4">
    {#each tracks as track}
        <Track {track} classes="mr-2" />
    {/each}
</div>
