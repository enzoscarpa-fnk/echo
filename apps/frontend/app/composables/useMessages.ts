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

    const updateMessage = async (conversationId: string, messageId: string, content: string) => {
        return await apiFetch(`/conversations/${conversationId}/messages/${messageId}`, {
            method: 'PATCH',
            body: { content }
        })
    }

    const deleteMessage = async (conversationId: string, messageId: string) => {
        return await apiFetch(`/conversations/${conversationId}/messages/${messageId}`, {
            method: 'DELETE'
        })
    }

    return {
        getMessages,
        sendMessage,
        updateMessage,
        deleteMessage,
        markAsRead,
    }
}
