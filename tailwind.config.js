
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}" // Catch root files too
    ],
    theme: {
        extend: {
            colors: {
                apple: {
                    gray: '#F5F5F7', // Apple standard background
                    blue: '#007AFF', // Apple System Blue
                    border: 'rgba(0, 0, 0, 0.1)', // Light border
                }
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"SF Pro Text"',
                    '"Helvetica Neue"',
                    'Helvetica',
                    'Arial',
                    'sans-serif'
                ]
            }
        },
    },
    plugins: [],
}
