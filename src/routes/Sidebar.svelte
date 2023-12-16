<script>
    import {
        Home,
        Disc3,
        GalleryVerticalEnd,
        Users2,
        ListMusic,
        Settings,
        Import,
        Puzzle
    } from 'lucide-svelte';
    import { _ } from 'svelte-i18n';
    import { page } from '$app/stores';
    import CreatePlaylist from '$components/CreatePlaylist.svelte';
    import { playlists } from '$lib/stores';
    import { selectAndImportPlaylist } from '$lib/playlists';

    let pathname = $page.url.pathname;

    $: pathname = $page.url.pathname;

    const pages = [
        { name: $_('home'), href: '/home', icon: Home },
        { name: $_('songs'), href: '/library/tracks', icon: Disc3 },
        {
            name: $_('albums'),
            href: '/library/albums',
            icon: GalleryVerticalEnd
        },
        { name: $_('artists'), href: '/library/artists', icon: Users2 },
        { name: $_('playlists'), href: '/library/playlists', icon: ListMusic },
        { name: $_('settings'), href: '/settings', icon: Settings },
        { name: $_('plugins'), href: '/settings/plugins', icon: Puzzle }
    ];
</script>

<div
    class="bg-neutral-300 dark:bg-neutral-900 h-full w-[12rem] overflow-y-auto"
>
    <nav class="list-nav text-sm">
        <ul>
            {#each pages as page}
                <li>
                    <a
                        href={page.href}
                        class={pathname === page.href
                            ? 'bg-neutral-200 dark:bg-neutral-800'
                            : ''}
                    >
                        <svelte:component
                            this={page.icon}
                            class="mr-2 p-[2px] stroke-primary-500 "
                        />
                        {page.name}
                    </a>
                </li>
            {/each}

            <hr class="m-4" />
            <h3 class="ml-4 text-lg">{$_('playlists')}</h3>
            <ul>
                {#if $playlists.length === 0}
                    <p class="ml-4">{$_('no_playlists')}</p>
                    <li class="ml-4" />
                {/if}
                <li>
                    <div class="space-y-1">
                        <CreatePlaylist />
                        <button
                            class="btn btn-sm variant-soft"
                            on:click={selectAndImportPlaylist}
                        >
                            <Import class="mr-2" />
                            {$_('import')}
                        </button>
                    </div>
                </li>
                {#each $playlists as playlist}
                    <li>
                        <a
                            href="/library/playlist?id={encodeURIComponent(
                                playlist.id
                            )}"
                        >
                            <ListMusic class="p-[2px] stroke-primary-500" />
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
