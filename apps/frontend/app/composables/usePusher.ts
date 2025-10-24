import { ref } from 'vue';
import Pusher from 'pusher-js';

export function usePusher(userId: string, token: string) {
    const pusher = new Pusher('<PUSHER_KEY>', {
        cluster: '<PUSHER_CLUSTER>',
        authEndpoint: '/api/users/pusher/auth',
        auth: {
            headers: { Authorization: `Bearer ${token}` },
        },
    });

    // Subscribe to private channel
    const channel = pusher.subscribe(`private-user-${userId}`);

    // Received events list
    const contactStatusUpdates = ref<any[]>([]);

    channel.bind('contact-status-changed', ( any) => {
        contactStatusUpdates.value.push(data);
    });

    const cleanup = () => {
        channel.unbind_all();
        pusher.unsubscribe(`private-user-${userId}`);
        pusher.disconnect();
    };

    return { pusher, channel, contactStatusUpdates, cleanup };
}
