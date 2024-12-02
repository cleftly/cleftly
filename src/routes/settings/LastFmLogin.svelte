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
        const res = await fetch({
            url: BASE_URL,
            method: 'POST',
            query: {
                method: 'auth.getToken',
                api_key: import.meta.env.PUBLIC_LASTFM_API_KEY,
                format: 'json'
            },
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': '0'
            }
        });

        if (res.status !== 200) {
            throw res;
        }

        const { token } = res.data as { [key: string]: unknown };

        open(
            'http://www.last.fm/api/auth/?api_key=' +
                import.meta.env.PUBLIC_LASTFM_API_KEY +
                '&token=' +
                token
        );

        status = 'started';

        // Until successful, keep polling every 1 second
        const poll = setInterval(async () => {
            const params = {
                method: 'auth.getSession',
                api_key: import.meta.env.PUBLIC_LASTFM_API_KEY,
                token,
                format: 'json'
            };

            await fetch({
                url: BASE_URL,
                method: 'POST',
                query: {
                    ...params,
                    api_sig: await signCall(
                        import.meta.env.PUBLIC_LASTFM_API_SECRET,
                        params
                    )
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': '0'
                }
            }).then(async (res) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = res.data as any;

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

            // const { status } = res.data;

            // if (status === 'ok') {
            //     clearInterval(poll);
            // }
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
