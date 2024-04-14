import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: [vitePreprocess({})],

    kit: {
        alias: {
            $assets: 'src/assets',
            $components: 'src/components',
            $packageJson: './package.json'
        },
        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        adapter: adapter(),
        // default-src 'self' blob: stream: tauri: https://localhost https://stream.localhost 'unsafe-inline'; script-src self stream: blob: tauri: https://localhost https://stream.localhost stream://localhost/*;"
        csp: {
            mode: 'auto',
            directives: {
                'default-src': [
                    'self',
                    'blob:',
                    'stream:',
                    'tauri:',
                    'https://localhost',
                    'https://stream.localhost',
                    'unsafe-inline'
                ],
                'script-src': [
                    'self',
                    'stream:',
                    'blob:',
                    'https://stream.localhost'
                ],
                'media-src': [
                    'self',
                    'https://*',
                    'blob:',
                    'stream:',
                    'tauri:'
                ],
                'img-src': ['self', 'https://*', 'blob:', 'stream:', 'tauri:']
            }
        }
    }
};

export default config;
