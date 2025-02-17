<script lang="ts">
    import { SlideToggle } from '@skeletonlabs/skeleton';
    import { Trash } from 'lucide-svelte';
    import { open } from '@tauri-apps/plugin-dialog';
    import { _ } from 'svelte-i18n';

    export let i: {
        name: string;
        description: string;
        type: string;
        options?: { label: string; value: string }[];
        onChange?: (val: unknown) => void;
    };
    export let key: string;
    export let value: unknown;

    async function importDirectory() {
        const dir = await open({
            multiple: true,
            directory: true,
            recursive: true
        });

        if (!dir) {
            return;
        }

        const dirs = value;

        if (Array.isArray(dir)) {
            dirs.push(...dir);
        } else {
            dirs.push(dir);
        }

        value = dirs;
    }
</script>

<div class="space-y-1">
    <h2 class="text-2xl">{i.name}</h2>
    {#if i.description}
        <p class="text-slate-400 md:max-w-[75%] whitespace-break-spaces">
            {i.description}
        </p>
    {/if}
</div>
{#if i.type === 'string'}
    <input class="input p-1" type="text" bind:value on:change={i.onChange} />
{:else if i.type === 'number'}
    <input class="input p-1" type="number" bind:value on:change={i.onChange} />
{:else if i.type === 'bool'}
    <SlideToggle
        name={key}
        type="checkbox"
        active="bg-primary-500"
        bind:checked={value}
        on:change={i.onChange}
    />
{:else if i.type === 'dirs'}
    {#each value as item}
        <div class="flex flex-row">
            <p>{item}</p>
            <button
                class="btn variant-ghost-error ml-2 h-8 p-2"
                on:click={() => {
                    value = value.filter((i) => i !== item);
                }}
            >
                <Trash />
            </button>
        </div>
    {/each}
    <button class="btn variant-ringed-primary" on:click={importDirectory}>
        {$_('add_directory')}
    </button>
{:else if i.type === 'enum'}
    <select
        class="select w-full max-w-xs p-1 rounded dark:bg-white dark:text-black"
        bind:value
        on:change={i.onChange}
    >
        {#each i.options as option}
            <option value={option.value}>{option.label}</option>
        {/each}
    </select>
{:else if i.type === 'hidden'}
    <span />
{:else}
    <p>{value}</p>
{/if}
