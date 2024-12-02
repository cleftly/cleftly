<script lang="ts">
    import Fuse from 'fuse.js';
    import { _ } from 'svelte-i18n';
    import { onMount } from 'svelte';
    import { Tab, TabGroup } from '@skeletonlabs/skeleton';
    import TrackList from './TrackList.svelte';
    import db, { type FriendlyTrack } from '$lib/db';
    import { eventManager } from '$lib/events';

    let inputRef: HTMLInputElement;
    let resRef: HTMLDivElement;
    let search = '';
    let active = false;
    let tracks: FriendlyTrack[] = [];
    let tabSet: number = 0;
    let res: {
        id: string;
        title: string;
        results: FriendlyTrack[];
    }[] = [];
    let cleanRes: typeof res = [];

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

        res = [];

        eventManager.fireEvent('onSearch', search).catch((err) => {
            console.error(err);
            console.error('Failed to fire event onSearch');
        });

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

        res.push({
            id: 'local',
            title: 'Local',
            results: fuse.search(search).map((item) => item.item)
        });
        res = res;

        window.addEventListener('click', unfocused);
    }

    onMount(() => {
        eventManager.onEvent('addSearchResult', async (payload) => {
            res = [...res, payload];
        });
    });

    $: res,
        (cleanRes = res.filter((obj, index, self) => {
            return self.findIndex((item) => item.id === obj.id) === index;
        }));

    // Search shortcut (Ctrl + k)
    window.addEventListener('keydown', async (e) => {
        if (e.ctrlKey && e.key === 'k') {
            inputRef?.focus();
        }
    });
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
            class="absolute card w-2/4 max-h-48 p-4 overflow-y-auto"
            tabindex="-1"
            style="top: {inputRef.clientHeight + 16}px;"
            bind:this={resRef}
        >
            <TabGroup>
                {#if cleanRes.length > 1}
                    {#each cleanRes as { title }, i}
                        <Tab bind:group={tabSet} name={title} value={i}>
                            {title}
                        </Tab>
                    {/each}
                {/if}
                <!-- Tab Panels --->

                <svelte:fragment slot="panel">
                    <TrackList
                        resort={false}
                        queueTracks={false}
                        tracks={cleanRes[tabSet]?.results || []}
                        mode="albumArt"
                        playMode="click"
                    />
                </svelte:fragment>
            </TabGroup>
        </div>
    {/if}
</div>
