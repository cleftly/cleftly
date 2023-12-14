import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const pinkTheme: CustomThemeConfig = {
    name: 'pink',
    properties: {
        // =~= Theme Properties =~=
        '--theme-font-family-base': `system-ui`,
        '--theme-font-family-heading': `system-ui`,
        '--theme-font-color-base': '0 0 0',
        '--theme-font-color-dark': '255 255 255',
        '--theme-rounded-base': '24px',
        '--theme-rounded-container': '8px',
        '--theme-border-base': '1px',
        // =~= Theme On-X Colors =~=
        '--on-primary': '0 0 0',
        '--on-secondary': '0 0 0',
        '--on-tertiary': '0 0 0',
        '--on-success': '0 0 0',
        '--on-warning': '0 0 0',
        '--on-error': '0 0 0',
        '--on-surface': '255 255 255',
        // =~= Theme Colors  =~=
        // primary | #ee24df
        '--color-primary-50': '252 222 250', // #fcdefa
        '--color-primary-100': '252 211 249', // #fcd3f9
        '--color-primary-200': '251 200 247', // #fbc8f7
        '--color-primary-300': '248 167 242', // #f8a7f2
        '--color-primary-400': '243 102 233', // #f366e9
        '--color-primary-500': '238 36 223', // #ee24df
        '--color-primary-600': '214 32 201', // #d620c9
        '--color-primary-700': '179 27 167', // #b31ba7
        '--color-primary-800': '143 22 134', // #8f1686
        '--color-primary-900': '117 18 109', // #75126d
        // secondary | #9d5ee0
        '--color-secondary-50': '240 231 250', // #f0e7fa
        '--color-secondary-100': '235 223 249', // #ebdff9
        '--color-secondary-200': '231 215 247', // #e7d7f7
        '--color-secondary-300': '216 191 243', // #d8bff3
        '--color-secondary-400': '186 142 233', // #ba8ee9
        '--color-secondary-500': '157 94 224', // #9d5ee0
        '--color-secondary-600': '141 85 202', // #8d55ca
        '--color-secondary-700': '118 71 168', // #7647a8
        '--color-secondary-800': '94 56 134', // #5e3886
        '--color-secondary-900': '77 46 110', // #4d2e6e
        // tertiary | #d086e6
        '--color-tertiary-50': '248 237 251', // #f8edfb
        '--color-tertiary-100': '246 231 250', // #f6e7fa
        '--color-tertiary-200': '243 225 249', // #f3e1f9
        '--color-tertiary-300': '236 207 245', // #eccff5
        '--color-tertiary-400': '222 170 238', // #deaaee
        '--color-tertiary-500': '208 134 230', // #d086e6
        '--color-tertiary-600': '187 121 207', // #bb79cf
        '--color-tertiary-700': '156 101 173', // #9c65ad
        '--color-tertiary-800': '125 80 138', // #7d508a
        '--color-tertiary-900': '102 66 113', // #664271
        // success | #2ef256
        '--color-success-50': '224 253 230', // #e0fde6
        '--color-success-100': '213 252 221', // #d5fcdd
        '--color-success-200': '203 252 213', // #cbfcd5
        '--color-success-300': '171 250 187', // #abfabb
        '--color-success-400': '109 246 137', // #6df689
        '--color-success-500': '46 242 86', // #2ef256
        '--color-success-600': '41 218 77', // #29da4d
        '--color-success-700': '35 182 65', // #23b641
        '--color-success-800': '28 145 52', // #1c9134
        '--color-success-900': '23 119 42', // #17772a
        // warning | #eeea81
        '--color-warning-50': '252 252 236', // #fcfcec
        '--color-warning-100': '252 251 230', // #fcfbe6
        '--color-warning-200': '251 250 224', // #fbfae0
        '--color-warning-300': '248 247 205', // #f8f7cd
        '--color-warning-400': '243 240 167', // #f3f0a7
        '--color-warning-500': '238 234 129', // #eeea81
        '--color-warning-600': '214 211 116', // #d6d374
        '--color-warning-700': '179 176 97', // #b3b061
        '--color-warning-800': '143 140 77', // #8f8c4d
        '--color-warning-900': '117 115 63', // #75733f
        // error | #ff5252
        '--color-error-50': '255 229 229', // #ffe5e5
        '--color-error-100': '255 220 220', // #ffdcdc
        '--color-error-200': '255 212 212', // #ffd4d4
        '--color-error-300': '255 186 186', // #ffbaba
        '--color-error-400': '255 134 134', // #ff8686
        '--color-error-500': '255 82 82', // #ff5252
        '--color-error-600': '230 74 74', // #e64a4a
        '--color-error-700': '191 62 62', // #bf3e3e
        '--color-error-800': '153 49 49', // #993131
        '--color-error-900': '125 40 40', // #7d2828
        // surface | #7734e5
        '--color-surface-50': '235 225 251', // #ebe1fb
        '--color-surface-100': '228 214 250', // #e4d6fa
        '--color-surface-200': '221 204 249', // #ddccf9
        '--color-surface-300': '201 174 245', // #c9aef5
        '--color-surface-400': '160 113 237', // #a071ed
        '--color-surface-500': '119 52 229', // #7734e5
        '--color-surface-600': '107 47 206', // #6b2fce
        '--color-surface-700': '89 39 172', // #5927ac
        '--color-surface-800': '71 31 137', // #471f89
        '--color-surface-900': '58 25 112' // #3a1970
    }
};
