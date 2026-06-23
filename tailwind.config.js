import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                navy: {
                    950: '#011226',
                    900: '#022647',
                    800: '#072b4c',
                    700: '#0a2e4f',
                    600: '#0c2f4e',
                    500: '#113352',
                    400: '#254f75',
                    300: '#7388a3',
                    200: '#cddcf1',
                },
                gold: {
                    700: '#b6915b',
                    600: '#d2b274',
                    500: '#d9aa72',
                    400: '#e0c08c',
                    300: '#ffda92',
                    200: '#ecc985',
                },
            },
        },
    },

    plugins: [forms],
};
