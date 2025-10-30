import { ref } from 'vue'
import Pusher from 'pusher-js'

/**
 * Composable pour gérer les connexions Pusher
 * @param channelId - ID du channel (userId ou conversationId)
 * @param channelType - Type de channel: 'user' (privé) ou 'conversation' (public)
 * @param token - Token d'auth (optionnel, requis pour les canaux privés)
 */
export function usePusher(
    channelId: string,
    channelType: 'user' | 'conversation' = 'user',
    token?: string
) {
    const config = useRuntimeConfig()

    // Configuration Pusher avec auth conditionnelle
    const pusherConfig: any = {
        cluster: config.public.pusherCluster || 'eu',
    }

    // Si canal privé (user), ajoute l'auth
    if (channelType === 'user' && token) {
        pusherConfig.authEndpoint = `${config.public.apiBase}/users/pusher/auth`
        pusherConfig.auth = {
            headers: { Authorization: `Bearer ${token}` },
        }
    }

    const pusher = new Pusher(config.public.pusherKey, pusherConfig)

    // Nom du canal selon le type
    const channelName = channelType === 'user'
        ? `private-user-${channelId}`
        : `conversation-${channelId}`

    console.log('📡 Subscribing to:', channelName)

    // Subscribe to channel
    const channel = ref(pusher.subscribe(channelName))

    // Events storage
    const contactStatusUpdates = ref<any[]>([])
    const newMessages = ref<any[]>([])

    // Bind events based on channel type
    if (channelType === 'user') {
        channel.value.bind('contact-status-changed', (data: any) => {
            console.log('👤 Contact status changed:', data)
            contactStatusUpdates.value.push(data)
        })
    } else if (channelType === 'conversation') {
        channel.value.bind('new-message', (data: any) => {
            console.log('💬 New message:', data)
            newMessages.value.push(data)
        })
    }

    const cleanup = () => {
        console.log('🧹 Cleaning up Pusher connection:', channelName)
        channel.value.unbind_all()
        pusher.unsubscribe(channelName)
        pusher.disconnect()
    }

    return {
        pusher,
        channel,
        contactStatusUpdates,
        newMessages,
        cleanup
    }
}
