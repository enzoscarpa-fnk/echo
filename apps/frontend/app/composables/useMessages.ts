export const useMessages = () => {
    const { apiFetch } = useApi()

    const getMessages = async (conversationId: string) => {
        return apiFetch(`/conversations/${conversationId}/messages`)
    }

    const sendMessage = async ( data: {
        content: string,
        conversationId: string
    }) => {
        return apiFetch(`/conversations/${data.conversationId}/messages`, {
            method: 'POST',
            body: {content: data.content},
        })
    }

    return {
        getMessages,
        sendMessage,
    }
}