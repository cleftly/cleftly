<script lang="ts">
    import type { ModalSettings } from '@skeletonlabs/skeleton';
    import { getToastStore, getModalStore } from '@skeletonlabs/skeleton';
    import { Plus } from 'lucide-svelte';

    import db from '$lib/db';
    import { _ } from 'svelte-i18n';

    const toastStore = getToastStore();
    const modalStore = getModalStore();

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

    export let classes = '';
</script>

<button class="btn btn-sm variant-soft {classes}" on:click={openModal}
    ><Plus /> {$_('create_playlist')}</button
>
