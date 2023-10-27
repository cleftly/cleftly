<script lang="ts">
    import {
        db,
        type Album,
        type FriendlyAlbum,
        type FriendlyTrack
    } from '$src/lib/db.js';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { playTrack } from '$src/lib/player';

    let album: FriendlyAlbum;
    let tracks: FriendlyTrack[] = [];

    onMount(async () => {
        const slug = $page.url.searchParams.get('id');

        console.log('SLUG', slug);
        if (!slug) {
            return (window.location.href = '/404');
        }

        const res = await db.albums.get(slug);

        if (!res) {
            return (window.location.href = '/404');
        }

        album = await db.friendlyAlbum(res as Album);

        tracks = (
            await Promise.all(
                (
                    await db.tracks.where('albumId').equals(slug).toArray()
                ).map(async (track) => await db.friendlyTrack(track))
            )
        ).sort((a, b) => a.trackNum - b.trackNum);

        console.log('album', album);
        console.log('tracks', tracks);
    });
</script>

{#if album}
    <h1 class="text-3xl mt-4">{album.name}</h1>
    <h2 class="text-xl">{album.artist.name}</h2>
    <dl class="list-dl mt-8">
        {#each tracks as track, i}
            <div
                on:click={() => playTrack(track, tracks)}
                class="hover:bg-red-400 hover:cursor-pointer"
            >
                <span class="badge bg-primary-500">{track.trackNum}</span>
                <span class="flex-auto">
                    <dt>{track.title}</dt>
                    <dd>{track.artist.name}</dd>
                </span>
            </div>
        {/each}
    </dl>
{/if}
