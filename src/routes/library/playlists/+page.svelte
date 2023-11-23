<script lang="ts">
    import Playlist from '$components/Playlist.svelte';
    import { _ } from 'svelte-i18n';

    $: playlists = data.playlists;

    export let data;
</script>

<h1 class="text-3xl mt-4 mb-8 justify-start">{$_('playlists')}</h1>
<div class="flex flex-wrap justify-start gap-4">
    {#each playlists as playlist}
        <Playlist {playlist} classes="mr-2" />
    {/each}
</div>
