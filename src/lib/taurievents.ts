import { listen } from '@tauri-apps/api/event';
import { get } from 'svelte/store';
import { progress } from './stores';

export default async function () {
    await listen('progressUpdate', (event) => {
        const payload = event.payload as {
            id: string;
            title: string;
            message?: string;
            progress?: number;
        };

        console.log('PAYLOAD', payload);

        progress.set(
            get(progress).set(payload.id, {
                title: payload.title,
                message: payload.message,
                progress: payload.progress
            })
        );
    });
}
