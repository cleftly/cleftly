<script lang="ts">
    import { _ } from 'svelte-i18n';
    import { front, player } from '$lib/stores';

    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
</script>

{#if $front.modal === 'playerSettings' && $player}
    <div
        class="overflow-y-auto p-4 bg-neutral-300 dark:bg-neutral-900 min-h-full"
    >
        <h3 class="text-2xl">{$_('settings')}</h3>
        <!-- Speed -->
        <div class="flex flex-row items-center justify-between">
            <div>
                <label class="label">
                    <span>{$_('speed')}</span>
                    <select class="select rounded" bind:value={$player.speed}>
                        {#each SPEEDS as speed}
                            <option value={speed}>{speed}x</option>
                        {/each}
                    </select>
                </label>
            </div>
        </div>
    </div>
{/if}
