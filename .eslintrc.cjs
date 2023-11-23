module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:svelte/recommended',
        'prettier',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript'
    ],
    ignorePatterns: ['*.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        extraFileExtensions: ['.svelte']
    },
    env: {
        browser: true,
        es2017: true,
        node: true
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        }
    ],
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
            }
        }
    },
    rules: {
        'import/order': ['warn'],
        'import/no-unresolved': 'off', // Doesn't work well with Svelte :(
        '@typescript-eslint/ban-ts-comment': ['warn']
    }
};
