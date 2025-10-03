export const useApi = () => {
    const config = useRuntimeConfig()
    const { getToken } = useAuth()

    const apiFetch = async <T>(url: string, options: any = {}) => {
        const token = await getToken()

        return $fetch<T>(`${config.public.apiBase}${url}`, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: token ? `Bearer ${token}` : '',
            },
        })
    }

    return {
        apiFetch,
    }
}