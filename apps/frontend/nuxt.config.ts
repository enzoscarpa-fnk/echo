import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path'

export default defineNuxtConfig({
    alias: {
        '@': resolve(__dirname)
    },
    compatibilityDate: '2025-10-02',
    devtools: { enabled: true },
    ssr: false,
    srcDir: 'app',
    pages: true,
    router: {
        options: {
            hashMode: false
        }
    },
    app: {
        baseURL: '/',
        buildAssetsDir: '/_nuxt/'
    },
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
            apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api',
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
    nitro: {
        devProxy: {
            '/api': {
                target: 'http://localhost:3001/api',
                changeOrigin: true,
            },
        },
    },
})
