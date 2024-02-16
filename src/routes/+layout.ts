import init_i18n from '$lib/i18n';

import { browser } from '$app/environment';

export const prerender = true;
export const ssr = false;

export const load = async () => {
    if (!browser) return;

    await init_i18n();
};
