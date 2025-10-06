export const useConversations = () => {
    const { apiFetch } = useApi()

    const getConversations = async () => {
        return apiFetch('/conversations')
    }

    const getConversation = async (id: string) => {
        return apiFetch(`/conversations/${id}`)
    }

    const createConversation = async (data: {
        name?: string
        participantIds?: string[]
        isGroup?: boolean
    }) => {
        return apiFetch('/conversations', {
            method: 'POST',
            body: data,
        })
    }

    return {
        getConversations,
        getConversation,
        createConversation,
    }
}