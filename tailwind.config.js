/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1ab394',
                    hover: '#18a689',
                    foreground: '#ffffff'
                },
                secondary: {
                    DEFAULT: '#e6e6e6',
                    text: '#676a6c'
                },
                sidebar: {
                    bg: '#2f4050',
                    text: '#a7b1c2',
                    active: '#293846',
                    header: '#212c38'
                },
                background: '#f3f3f4',
                text: {
                    main: '#676a6c',
                    heading: '#676a6c',
                    muted: '#888888'
                },
                border: '#e7eaec'
            },
            fontFamily: {
                sans: ['"Open Sans"', 'Helvetica', 'Arial', 'sans-serif'],
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)' },
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
                'scale-in': 'scaleIn 0.2s ease-out forwards',
            }
        },
    },
    plugins: [],
}
