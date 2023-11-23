<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import type { FriendlyAlbum } from '$lib/db';

    export let album: FriendlyAlbum;
    export let titleClamp: 1 | 2 = 2;
    export let classes = '';
</script>

<div class="w-44 {classes}">
    <a href="/library/album?id={encodeURIComponent(album.id)}">
        <Avatar
            src={album.albumArt}
            class="rounded-lg w-44 h-44 hover:brightness-90 hover:cursor-pointer mb-1"
            initials={album.name.slice(0, 2)}
        />
    </a>

    <h3
        class="ml-1 text-sm hover:brightness-90 hover:cursor-pointer {titleClamp ===
        2
            ? 'line-clamp-2'
            : 'line-clamp-1'}"
    >
        <a href="/library/album?id={encodeURIComponent(album.id)}">
            {album.name}
        </a>
    </h3>

    <p class="ml-1 text-xs line-clamp-1">
        <a
            class="anchor no-underline"
            href="/library/artist?id={encodeURIComponent(album.artist.id)}"
        >
            {album.artist.name}
        </a>
    </p>
</div>
