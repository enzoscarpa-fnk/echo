export default defineNuxtConfig({
    compatibilityDate: '2025-09-18',
    devtools: { enabled: true },
    devServer: {
        port: 3000  // ← Configuration du port ici
    },
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
})
