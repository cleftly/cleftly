<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import type { FriendlyTrack } from '$lib/db';
    import { playTrack } from '$lib/player';

    export let track: FriendlyTrack;
    export let titleClamp: 1 | 2 = 2;
    export let classes = '';
    export let view: 'album' | 'artist' = 'album';
</script>

<div class="w-44 {classes}">
    <Avatar
        src={track.album.albumArt}
        class="rounded-lg w-44 h-44 hover:brightness-90 hover:cursor-pointer mb-1"
        initials={track.album.name.slice(0, 2)}
        on:click={() => playTrack(track, [track])}
    />

    <button class="" on:click={() => playTrack(track, [track])}>
        <span
            class="text-left text-sm hover:brightness-90 hover:cursor-pointer {titleClamp ===
            2
                ? 'line-clamp-2'
                : 'line-clamp-1'}"
        >
            {track.title}
        </span>
    </button>

    <p class="text-xs line-clamp-1">
        <a
            class="anchor no-underline"
            href="/library/{view}?id={encodeURIComponent(
                view === 'album' ? track.album.id : track.artist.id
            )}"
        >
            {view === 'album' ? track.album.name : track.artist.name}
        </a>
    </p>
</div>
