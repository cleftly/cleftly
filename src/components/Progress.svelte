<script lang="ts">
    import { popup, type PopupSettings } from '@skeletonlabs/skeleton';
    import { Bell, Loader2 } from 'lucide-svelte';
    import { progress } from '$lib/stores';

    const progressPopup: PopupSettings = {
        // Represents the type of event that opens/closed the popup
        event: 'click',
        // Matches the data-popup value on your popup element
        target: 'progressPopup',
        // Defines which side of your trigger the popup will appear
        placement: 'bottom'
    };

    let runningTasks = false;

    progress.subscribe((value) => {
        runningTasks =
            Array.from(value.values()).filter(
                (v) => typeof v.progress !== 'number' || v.progress < 1
            ).length > 0;
    });
</script>

<div
    class="card p-2 w-[12rem] bg-neutral-300 dark:bg-neutral-900 h-72 shadow-xl overflow-y-auto"
    data-popup="progressPopup"
>
    <ul class="list-nav text-sm">
        <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
        {#each $progress as [_, status]}
            <li>
                <button class="w-full">
                    <span>
                        {status.title} - {typeof status.progress === 'number'
                            ? `${Math.round(status.progress * 100)}%`
                            : ''}
                    </span>
                </button>
            </li>
        {/each}
    </ul>
</div>

{#if Array.from($progress.keys()).length > 0}
    <button class="btn" use:popup={progressPopup}>
        {#if runningTasks}
            <Loader2 class="animate-spin" />
        {:else}
            <Bell />
        {/if}
    </button>
{/if}
