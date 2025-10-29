export const useMessages = () => {
    const { apiFetch } = useApi()

    const getMessages = async (conversationId: string) => {
        return apiFetch(`/conversations/${conversationId}/messages`)
    }

    const sendMessage = async ({ content,conversationId }: {
        content: string
        conversationId: string
    }) => {
        return apiFetch(`/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: {
                content: content,
            },
        })
    }

    const markAsRead = async (conversationId: string) => {
        return apiFetch(`/conversations/${conversationId}/messages/read`, {
            method: 'POST',
        })
    }

    return {
        getMessages,
        sendMessage,
        markAsRead,
    }
}
