<script lang="ts">
    import { _ } from 'svelte-i18n';
    import Album from '$components/Album.svelte';

    $: albums = data.albums;

    export let data;
</script>

<h1 class="text-3xl mt-4 mb-8 justify-start">{$_('albums')}</h1>
<div class="flex flex-wrap justify-start gap-4">
    {#each albums as album}
        <Album {album} classes="mr-2" />
    {/each}
</div>
