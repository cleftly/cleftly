import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const pinkTheme: CustomThemeConfig = {
    name: 'pink',
    properties: {
        // =~= Theme Properties =~=
        '--theme-font-family-base': `system-ui`,
        '--theme-font-family-heading': `system-ui`,
        '--theme-font-color-base': '0 0 0',
        '--theme-font-color-dark': '255 255 255',
        '--theme-rounded-base': '16px',
        '--theme-rounded-container': '8px',
        '--theme-border-base': '1px',
        // =~= Theme On-X Colors =~=
        '--on-primary': '0 0 0',
        '--on-secondary': '255 255 255',
        '--on-tertiary': '0 0 0',
        '--on-success': '255 255 255',
        '--on-warning': '0 0 0',
        '--on-error': '0 0 0',
        '--on-surface': '0 0 0',
        // =~= Theme Colors  =~=
        // primary | #ff7ae7
        '--color-primary-50': '255 235 251', // #ffebfb
        '--color-primary-100': '255 228 250', // #ffe4fa
        '--color-primary-200': '255 222 249', // #ffdef9
        '--color-primary-300': '255 202 245', // #ffcaf5
        '--color-primary-400': '255 162 238', // #ffa2ee
        '--color-primary-500': '255 122 231', // #ff7ae7
        '--color-primary-600': '230 110 208', // #e66ed0
        '--color-primary-700': '191 92 173', // #bf5cad
        '--color-primary-800': '153 73 139', // #99498b
        '--color-primary-900': '125 60 113', // #7d3c71
        // secondary | #ba2612
        '--color-secondary-50': '245 222 219', // #f5dedb
        '--color-secondary-100': '241 212 208', // #f1d4d0
        '--color-secondary-200': '238 201 196', // #eec9c4
        '--color-secondary-300': '227 168 160', // #e3a8a0
        '--color-secondary-400': '207 103 89', // #cf6759
        '--color-secondary-500': '186 38 18', // #ba2612
        '--color-secondary-600': '167 34 16', // #a72210
        '--color-secondary-700': '140 29 14', // #8c1d0e
        '--color-secondary-800': '112 23 11', // #70170b
        '--color-secondary-900': '91 19 9', // #5b1309
        // tertiary | #1eb972
        '--color-tertiary-50': '221 245 234', // #ddf5ea
        '--color-tertiary-100': '210 241 227', // #d2f1e3
        '--color-tertiary-200': '199 238 220', // #c7eedc
        '--color-tertiary-300': '165 227 199', // #a5e3c7
        '--color-tertiary-400': '98 206 156', // #62ce9c
        '--color-tertiary-500': '30 185 114', // #1eb972
        '--color-tertiary-600': '27 167 103', // #1ba767
        '--color-tertiary-700': '23 139 86', // #178b56
        '--color-tertiary-800': '18 111 68', // #126f44
        '--color-tertiary-900': '15 91 56', // #0f5b38
        // success | #303bbe
        '--color-success-50': '224 226 245', // #e0e2f5
        '--color-success-100': '214 216 242', // #d6d8f2
        '--color-success-200': '203 206 239', // #cbceef
        '--color-success-300': '172 177 229', // #acb1e5
        '--color-success-400': '110 118 210', // #6e76d2
        '--color-success-500': '48 59 190', // #303bbe
        '--color-success-600': '43 53 171', // #2b35ab
        '--color-success-700': '36 44 143', // #242c8f
        '--color-success-800': '29 35 114', // #1d2372
        '--color-success-900': '24 29 93', // #181d5d
        // warning | #ecb0a8
        '--color-warning-50': '252 243 242', // #fcf3f2
        '--color-warning-100': '251 239 238', // #fbefee
        '--color-warning-200': '250 235 233', // #faebe9
        '--color-warning-300': '247 223 220', // #f7dfdc
        '--color-warning-400': '242 200 194', // #f2c8c2
        '--color-warning-500': '236 176 168', // #ecb0a8
        '--color-warning-600': '212 158 151', // #d49e97
        '--color-warning-700': '177 132 126', // #b1847e
        '--color-warning-800': '142 106 101', // #8e6a65
        '--color-warning-900': '116 86 82', // #745652
        // error | #afa83c
        '--color-error-50': '243 242 226', // #f3f2e2
        '--color-error-100': '239 238 216', // #efeed8
        '--color-error-200': '235 233 206', // #ebe9ce
        '--color-error-300': '223 220 177', // #dfdcb1
        '--color-error-400': '199 194 119', // #c7c277
        '--color-error-500': '175 168 60', // #afa83c
        '--color-error-600': '158 151 54', // #9e9736
        '--color-error-700': '131 126 45', // #837e2d
        '--color-error-800': '105 101 36', // #696524
        '--color-error-900': '86 82 29', // #56521d
        // surface | #bf94e5
        '--color-surface-50': '245 239 251', // #f5effb
        '--color-surface-100': '242 234 250', // #f2eafa
        '--color-surface-200': '239 228 249', // #efe4f9
        '--color-surface-300': '229 212 245', // #e5d4f5
        '--color-surface-400': '210 180 237', // #d2b4ed
        '--color-surface-500': '191 148 229', // #bf94e5
        '--color-surface-600': '172 133 206', // #ac85ce
        '--color-surface-700': '143 111 172', // #8f6fac
        '--color-surface-800': '115 89 137', // #735989
        '--color-surface-900': '94 73 112' // #5e4970
    }
};
