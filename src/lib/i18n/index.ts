import { addMessages, getLocaleFromNavigator, init } from 'svelte-i18n';

import en from '$lib/i18n/en.json';
import es from '$lib/i18n/es.json';

export default async () => {
    addMessages('en', en);
    addMessages('es', es);

    const { getOrCreateConfig } = await import('$lib/config');

    console.log((await getOrCreateConfig()).lang);

    init({
        fallbackLocale: 'en',
        initialLocale:
            (await getOrCreateConfig()).lang || getLocaleFromNavigator()
    });
};
