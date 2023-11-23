// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface Platform {}
    }
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            [key: string]: string | undefined;
            PUBLIC_LASTFM_API_KEY: string;
            PUBLIC_LASTFM_API_SECRET: string;
        }
    }
}

export {};
