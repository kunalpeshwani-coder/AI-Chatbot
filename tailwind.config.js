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
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                navy: {
                    950: '#03132A',
                    900: '#071e3d',
                    800: '#0E2038',
                    700: '#112444',
                    600: '#163050',
                    500: '#1a3a5c',
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
