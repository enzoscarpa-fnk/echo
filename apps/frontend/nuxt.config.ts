import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path'

export default defineNuxtConfig({
    alias: {
        '@': resolve(__dirname)
    },
    compatibilityDate: '2025-10-02',
    devtools: { enabled: true },
    ssr: true,
    devServer: {
        port: 3000
    },
    css: [
        '@/assets/css/main.css'
    ],
    modules: [
        '@nuxt/eslint',
        '@nuxt/image',
        '@nuxt/ui',
        '@clerk/nuxt'
    ],
    runtimeConfig: {
        public: {
            clerkPublishableKey: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
            apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
        },
    },
    vite: {
        plugins: [
            tailwindcss(),
        ],
        css: {
            preprocessorOptions: {}
        }
    },
    clerk: {
        appearance: {
            baseTheme: 'dark', // or 'light'
        },
        signInFallbackRedirectUrl: '/',
        signInForceRedirectUrl: '/chat',
    },
})
