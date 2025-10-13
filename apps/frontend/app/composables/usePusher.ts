import { ref, onUnmounted } from 'vue';
import Pusher from 'pusher-js';

export function usePusher(userId: string, token: string) {
    const pusher = new Pusher('<PUSHER_KEY>', {
        cluster: '<PUSHER_CLUSTER>',
        authEndpoint: '/api/users/pusher/auth',
        auth: {
            headers: { Authorization: `Bearer ${token}` },
        },
    });

    // Souscription au channel privé Pusher de l’utilisateur connecté
    const channel = pusher.subscribe(`private-user-${userId}`);

    // Liste d’événements reçus
    const contactStatusUpdates = ref<any[]>([]);

    channel.bind('contact-status-changed', ( any) => {
        // Ici : met à jour un state global/VueX/pinia OU la liste de notifications locales
        contactStatusUpdates.value.push(data);
        // Par exemple: data = { userId, isOnline, lastSeenAt }
    });

    onUnmounted(() => {
        channel.unbind_all();
        pusher.unsubscribe(`private-user-${userId}`);
        pusher.disconnect();
    });

    return { pusher, channel, contactStatusUpdates };
}
