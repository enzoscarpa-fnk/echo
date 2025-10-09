import Pusher from 'pusher-js';

export default defineNuxtPlugin((nuxtApp) => {
    // On configure avec la Pusher Key publique et le cluster
    const pusher = new Pusher(
        process.env.NUXT_PUBLIC_PUSHER_KEY!,
        { cluster: process.env.NUXT_PUBLIC_PUSHER_CLUSTER!, forceTLS: true }
    )


    // On expose Pusher pour tout le frontend via provide/inject
    nuxtApp.provide('pusher', pusher);
});
