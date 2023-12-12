<script>
    import {
        Home,
        Disc3,
        GalleryVerticalEnd,
        Users2,
        ListMusic,
        Settings
    } from 'lucide-svelte';
    import { _ } from 'svelte-i18n';
    import CreatePlaylist from '$components/CreatePlaylist.svelte';
    import { playlists } from '$lib/stores';
</script>

<div
    class="bg-neutral-300 dark:bg-neutral-900 h-full w-[12rem] overflow-y-auto"
>
    <nav class="list-nav text-sm">
        <ul>
            <li>
                <a href="/home"><Home class="mr-2" /> {$_('home')}</a>
            </li>
            <li>
                <a href="/library/tracks"
                    ><Disc3 class="mr-2" /> {$_('songs')}</a
                >
            </li>
            <li>
                <a href="/library/albums"
                    ><GalleryVerticalEnd class="mr-2" />
                    {$_('albums')}</a
                >
            </li>
            <li>
                <a href="/library/artists"
                    ><Users2 class="mr-2" /> {$_('artists')}</a
                >
            </li>
            <li>
                <a href="/library/playlists"
                    ><ListMusic class="mr-2" /> {$_('playlists')}</a
                >
            </li>

            <li>
                <a href="/settings"
                    ><Settings class="mr-2" /> {$_('settings')}</a
                >
            </li>
            <hr class="m-4" />
            <h3 class="ml-4 text-lg">{$_('playlists')}</h3>
            <ul>
                {#if $playlists.length === 0}
                    <p class="ml-4">{$_('no_playlists')}</p>
                    <li class="ml-4" />
                {/if}
                <li>
                    <CreatePlaylist />
                </li>
                {#each $playlists as playlist}
                    <li>
                        <a
                            href="/library/playlist?id={encodeURIComponent(
                                playlist.id
                            )}"
                        >
                            <ListMusic class="mr-2" />
                            <span class="truncate">
                                {playlist.name}
                            </span>
                        </a>
                    </li>
                {/each}
            </ul>
        </ul>
    </nav>
</div>
