<script lang="ts">
    import {
        Avatar,
        getModalStore,
        type PopupSettings
    } from '@skeletonlabs/skeleton';
    import type { FriendlyPlaylist } from '$lib/db';

    export let playlist: FriendlyPlaylist;
    export let titleClamp: 1 | 2 = 2;
    export let classes = '';
</script>

<div class="w-44 {classes}">
    <a href="/library/playlist?id={encodeURIComponent(playlist.id)}">
        <!-- TODO -->
        <Avatar
            src={playlist.art}
            class="rounded-lg w-44 h-44 hover:brightness-90 hover:cursor-pointer mb-1"
            initials={playlist.name.slice(0, 2)}
        />
    </a>

    <h3
        class="ml-1 text-sm hover:brightness-90 hover:cursor-pointer {titleClamp ===
        2
            ? 'line-clamp-2'
            : 'line-clamp-1'}"
    >
        <a href="/library/playlist?id={encodeURIComponent(playlist.id)}">
            {playlist.name}
        </a>
    </h3>
</div>
