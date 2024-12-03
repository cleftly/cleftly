<script lang="ts">
    import { getVersion } from '@tauri-apps/api/app';
    import { relaunch } from '@tauri-apps/plugin-process';
    import { check, Update } from '@tauri-apps/plugin-updater';
    import { Loader2 } from 'lucide-svelte';
    import { onMount } from 'svelte';

    // "https://github.com/cleftly/cleftly/releases/latest/download/latest.json"

    let status:
        | 'error'
        | 'checking'
        | 'up_to_date'
        | 'downloading'
        | 'downloaded'
        | 'installing'
        | 'complete' = 'checking';
    let error: string | null = null;
    let update: Update | null = null;
    let version: string;
    let progress: {
        downloaded: number;
        total: number;
        timeSince: number | null;
        bps: number;
    } = {
        downloaded: 0,
        total: 0,
        timeSince: null,
        bps: 0
    };

    onMount(async () => {
        version = await getVersion();

        try {
            update = await check();
        } catch (e) {
            error = `${e}`;
            status = 'error';
            return;
        }

        if (!update) return (status = 'up_to_date');

        download();
    });

    async function download() {
        if (!update) return;

        await update
            .download((event) => {
                switch (event.event) {
                    case 'Started':
                        status = 'downloading';
                        progress.total = event.data.contentLength || 0;
                        progress.timeSince = new Date().getTime();
                        break;
                    case 'Progress':
                        if (
                            progress.timeSince &&
                            new Date().getTime() - progress.timeSince > 0
                        ) {
                            progress.bps =
                                event.data.chunkLength /
                                (new Date().getTime() / 1000 -
                                    progress.timeSince / 1000);
                        }

                        progress.timeSince = new Date().getTime();
                        progress.downloaded += event.data.chunkLength;

                        break;
                    case 'Finished':
                        progress.bps = 0;
                        break;
                }
            })
            .then(() => {
                status = 'downloaded';
            })
            .catch((e) => {
                console.error(e);
                error = `${e}`;
                status = 'error';
                return;
            });
    }

    async function install() {
        if (!update) return;

        try {
            await update.install();
        } catch (e) {
            error = `${e}`;
            status = 'error';
            return;
        }

        await relaunch();
        status = 'up_to_date';
    }
</script>

{#if status === 'error'}
    <div class="flex items-center space-x-2 text-red-400">
        <span>Failed to update: {error || 'Unknown error'}</span>
    </div>
{/if}

{#if status === 'checking'}
    <div class="flex items-center space-x-2 text-slate-400">
        <Loader2 class="animate-spin" />
        <span>Checking...</span>
    </div>
{/if}

{#if status === 'up_to_date'}
    <div class="flex items-center space-x-2 text-green-400">
        <span>Up to date (v{version})</span>
    </div>
{/if}

{#if status === 'downloading' && update}
    <div class="flex items-center space-x-2 text-slate-400">
        <Loader2 class="animate-spin" />
        <span>Downloading v{update.version}...</span>
        <span
            >({(progress.downloaded / (1024 * 1024)).toFixed(2)}MB of {(
                progress.total /
                (1024 * 1024)
            ).toFixed(2)}
            MB - {((progress.downloaded / progress.total) * 100).toFixed(
                0
            )}%)</span
        ><span>({(progress.bps / (1024 * 1024)).toFixed(2)}MB/s)</span>
    </div>
{/if}

{#if status === 'downloaded' && update}
    <div class="flex items-center space-x-2 text-slate-400">
        <span>Downloaded v{update.version}</span>
    </div>
    <button on:click={install} class="btn variant-filled-primary">
        Install
    </button>
{/if}
