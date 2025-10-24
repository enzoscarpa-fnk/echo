export const useUsers = () => {
    const api = useApi()

    /**
     * Get all users (excluding current user)
     */
    const getUsers = async () => {
        try {
            const response = await api('/users')
            return response
        } catch (error: any) {
            console.error('Error fetching users:', error)
            throw error
        }
    }

    /**
     * Search users by query
     */
    const searchUsers = async (query: string) => {
        try {
            const response = await api(`/users/search?query=${encodeURIComponent(query)}`)
            return response
        } catch (error: any) {
            console.error('Error searching users:', error)
            throw error
        }
    }

    /**
     * Get a specific user by ID
     */
    const getUser = async (userId: string) => {
        try {
            const response = await api(`/users/${userId}`)
            return response
        } catch (error: any) {
            console.error('Error fetching user:', error)
            throw error
        }
    }

    /**
     * Get current authenticated user
     */
    const getCurrentUser = async () => {
        try {
            const response = await api('/users/me')
            return response
        } catch (error: any) {
            console.error('Error fetching current user:', error)
            throw error
        }
    }

    return {
        getUsers,
        searchUsers,
        getUser,
        getCurrentUser,
    }
}
