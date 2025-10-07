export const useMessages = () => {
    const { apiFetch } = useApi()

    const getMessages = async (conversationId: string) => {
        return apiFetch(`/messages?conversationId=${conversationId}`)
    }

    const sendMessage = async ( data: {
        content: string
        conversationId: string
    }) => {
        return apiFetch('/messages', {
            method: 'POST',
            body: data,
        })
    }

    return {
        getMessages,
        sendMessage,
    }
}