<script>
    import {
        Disc3,
        GalleryVerticalEnd,
        Home,
        ListMusic,
        Settings
    } from 'lucide-svelte';
</script>

<div class="w-full h-16 flex justify-between items-center bg-neutral-900 p-8">
    <a href="/home" class="flex items-center">
        <Home />
    </a>

    <a href="/library/tracks" class="flex items-center">
        <Disc3 class="mr-2" />
    </a>

    <a href="/library/albums" class="flex items-center">
        <GalleryVerticalEnd />
    </a>

    <a href="/library/playlists" class="flex items-center">
        <ListMusic />
    </a>

    <a href="/settings" class="flex items-center">
        <Settings />
    </a>
</div>
