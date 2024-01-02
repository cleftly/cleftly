<script lang="ts">
    import Fuse from 'fuse.js';
    import { _ } from 'svelte-i18n';
    import TrackList from './TrackList.svelte';
    import db, { type FriendlyTrack } from '$lib/db';

    let inputRef: HTMLInputElement;
    let resRef: HTMLDivElement;
    let search = '';
    let active = false;
    let res: FriendlyTrack[] = [];
    let tracks: FriendlyTrack[] = [];

    function unfocused(e?: MouseEvent) {
        // If target is parent of inputRef or resRef, return
        if (
            inputRef &&
            e &&
            (inputRef.contains(e.target) || resRef.contains(e.target))
        )
            return;

        active = false;
        window.removeEventListener('click', unfocused);
    }

    async function updateSearch() {
        if (!search) return (active = false);

        active = true;

        if (tracks.length < 1) {
            tracks = await Promise.all(
                (
                    await db.tracks.toArray()
                ).map(async (track) => await db.friendlyTrack(track))
            );
        }

        const options = {
            keys: [
                {
                    name: 'title',
                    weight: 1
                },
                {
                    name: 'artist.name',
                    weight: 0.5
                },
                {
                    name: 'album.name',
                    weight: 0.5
                }
            ],
            shouldSort: true
        };

        const fuse = new Fuse(tracks, options);

        res = fuse.search(search).map((item) => item.item);

        window.addEventListener('click', unfocused);
    }
</script>

<div class="flex flex-col w-2/4 items-center justify-center">
    <input
        class="input rounded-lg p-1"
        type="text"
        placeholder={$_('search')}
        bind:this={inputRef}
        bind:value={search}
        on:input={updateSearch}
    />
    {#if inputRef && active}
        <div
            class="absolute card w-full max-w-sm max-h-48 p-4 overflow-y-auto"
            tabindex="-1"
            style="top: {inputRef.clientHeight + 16}px;"
            bind:this={resRef}
        >
            <ul class="list-nav text-sm w-full">
                <TrackList
                    resort={false}
                    queueTracks={false}
                    tracks={res}
                    mode="albumArt"
                    playMode="click"
                />
            </ul>
        </div>
    {/if}
</div>
