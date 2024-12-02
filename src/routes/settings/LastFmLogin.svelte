<script lang="ts">
    import { onMount } from 'svelte';
    import { Loader2 } from 'lucide-svelte';
    import { open } from '@tauri-apps/plugin-shell';
    import { fetch } from '@tauri-apps/plugin-http';
    import { BASE_URL, signCall } from '$lib/integrations/lastfm';
    import { getOrCreateConfig, saveConfig } from '$lib/config';
    import LastFm from '$components/icons/LastFm.svelte';

    let status = 'not_started';

    async function initiateLogin() {
        const res = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=auth.getToken&api_key=${
                import.meta.env.PUBLIC_LASTFM_API_KEY
            }&format=json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const { token } = (await res.json()) as { [key: string]: string };

        open(
            'http://www.last.fm/api/auth/?api_key=' +
                import.meta.env.PUBLIC_LASTFM_API_KEY +
                '&token=' +
                token
        );

        status = 'started';

        // Until successful, keep polling every 1 second
        const poll = setInterval(async () => {
            let params: { [key: string]: string } = {
                method: 'auth.getSession',
                api_key: import.meta.env.PUBLIC_LASTFM_API_KEY,
                token,
                format: 'json'
            };

            params = {
                ...params,
                api_sig: await signCall(
                    import.meta.env.PUBLIC_LASTFM_API_SECRET,
                    params
                )
            };

            const url = new URL(BASE_URL);
            Object.keys(params).forEach((key) =>
                url.searchParams.append(key, params[key])
            );

            await fetch(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async (res) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = await res.json();

                if (res.status !== 200) {
                    if (data?.error !== 14) {
                        clearInterval(poll);
                        throw res;
                    }

                    return;
                }

                await saveConfig({
                    ...(await getOrCreateConfig()),
                    lastfm_token: data.session.key
                });
                status = 'complete';
                clearInterval(poll);
            });
        }, 1000);
    }

    async function remove() {
        await saveConfig({
            ...(await getOrCreateConfig()),
            lastfm_token: ''
        });
        status = 'not_started';
    }

    onMount(async () => {
        if ((await getOrCreateConfig()).lastfm_token) {
            status = 'complete';
        }
    });
</script>

{#if status === 'not_started'}
    <button on:click={initiateLogin} class="btn variant-filled-primary">
        <div class="w-6 h-6 mr-2"><LastFm /></div>
        Login to Last.fm
    </button>
{:else if status === 'started'}
    <div class="flex items-center space-x-2">
        <span>Waiting for login...</span>
    </div>
    <Loader2 class="animate-spin" />
{:else}
    <p>Logged in to Last.fm</p>
    <button on:click={remove} class="btn variant-filled-error">
        <div class="w-6 h-6 mr-2"><LastFm /></div>
        Remove Last.fm
    </button>
{/if}
