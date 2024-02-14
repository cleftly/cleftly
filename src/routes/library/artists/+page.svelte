<script lang="ts">
    import { _ } from 'svelte-i18n';

    $: artists = data.artists;

    export let data;
</script>

<h1 class="text-3xl mt-4 mb-8 justify-start">{$_('artists')}</h1>

<nav class="list-nav">
    <ul>
        {#each artists as artist, i}
            <li class={i % 2 === 0 ? 'bg-neutral-300 dark:bg-neutral-900' : ''}>
                <a href="/library/artist?id={encodeURIComponent(artist.id)}">
                    <span class="flex-auto">{artist.name}</span>
                </a>
            </li>
        {/each}
    </ul>
</nav>
