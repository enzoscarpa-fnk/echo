import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path'

export default defineNuxtConfig({
    alias: {
        '@': resolve(__dirname)
    },
    compatibilityDate: '2025-09-18',
    devtools: { enabled: true },
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
        signInFallbackRedirectUrl: '/',
        signInForceRedirectUrl: '/chat',
    },
})
