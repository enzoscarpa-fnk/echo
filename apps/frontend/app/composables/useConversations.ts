export const useConversations = () => {
    const api = useApi()

    /**
     * Create a 1:1 conversation with another user
     */
    const createConversation = async (participantId: string) => {
        try {
            const response = await api('/conversations', {
                method: 'POST',
                body: {
                    participantIds: [participantId],
                    isGroup: false,
                },
            })
            return response
        } catch (error: any) {
            console.error('Error creating conversation:', error)
            throw error
        }
    }

    /**
     * Get all conversations for current user
     */
    const getConversations = async () => {
        try {
            const response = await api('/conversations')
            return response
        } catch (error: any) {
            console.error('Error fetching conversations:', error)
            throw error
        }
    }

    /**
     * Get a single conversation by ID
     */
    const getConversation = async (conversationId: string) => {
        try {
            const response = await api(`/conversations/${conversationId}`)
            return response
        } catch (error: any) {
            console.error('Error fetching conversation:', error)
            throw error
        }
    }

    return {
        createConversation,
        getConversations,
        getConversation,
    }
}
