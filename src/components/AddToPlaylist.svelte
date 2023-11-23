<script lang="ts">
    import {
        popup,
        type ModalSettings,
        type PopupSettings,
        getModalStore,
        getToastStore
    } from '@skeletonlabs/skeleton';
    import { ListMusic, ListPlus, Plus } from 'lucide-svelte';

    import db, { type FriendlyTrack, type Playlist } from '$lib/db';
    import { playlists } from '$lib/stores';
    import { _ } from 'svelte-i18n';

    const modalStore = getModalStore();
    const toastStore = getToastStore();

    const addToPlaylistPopup: PopupSettings = {
        // Represents the type of event that opens/closed the popup
        event: 'click',
        // Matches the data-popup value on your popup element
        target: 'addToPlaylist',
        // Defines which side of your trigger the popup will appear
        placement: 'bottom'
    };

    const modal: ModalSettings = {
        type: 'prompt',
        title: $_('create_playlist'),
        body: $_('enter_playlist_name'),
        value: '',
        valueAttr: {
            type: 'text',
            minlength: 1,
            maxlength: 16,
            required: true
        },
        response: async (r: string) => {
            if (!r) return;
            await db.playlists.add({
                id: crypto.randomUUID(),
                name: r,
                trackIds: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            toastStore.trigger({
                message: $_('created_playlist'),
                background: 'variant-filled-success'
            });
        }
    };

    export async function openModal() {
        modalStore.trigger(modal);
    }

    async function _add(playlist: Playlist) {
        await db.playlists.update(playlist.id, {
            trackIds: [...playlist.trackIds, ...tracks.map((t) => t.id)]
        });

        toastStore.trigger({
            // message: `Added to ${playlist.name}`,
            message: $_('added_to', { values: { name: playlist.name } }),
            background: 'variant-filled-success'
        });
    }

    async function add(playlist: Playlist) {
        // Check for duplicates
        if (!playlist.trackIds.includes(tracks[0].id)) {
            return _add(playlist);
        }

        const duplicateModal: ModalSettings = {
            type: 'confirm',
            title: `⚠️ ${$_('song_already_in_playlist')}`,
            body: $_('song_already_in_playlist_confirmation', {
                values: {
                    name: playlist.name
                }
            }),
            response: (r: boolean) => {
                if (r) {
                    _add(playlist);
                }
            }
        };

        modalStore.trigger(duplicateModal);
    }

    export let tracks: FriendlyTrack[];
</script>

<div
    class="card p-2 w-[12rem] bg-neutral-900 h-72 shadow-xl overflow-y-auto"
    data-popup="addToPlaylist"
>
    <ul class="list-nav text-sm">
        <li>
            <button class="w-full" on:click={openModal}>
                <Plus class="mr-2" />
                {$_('create_playlist')}
            </button>
        </li>
        {#each $playlists as playlist}
            <li>
                <button on:click={() => add(playlist)} class="w-full">
                    <ListMusic class="mr-2" />
                    <span class="truncate">
                        {playlist.name}
                    </span>
                </button>
            </li>
        {/each}
    </ul>
</div>

<button class="btn p-0" use:popup={addToPlaylistPopup}><ListPlus /></button>
