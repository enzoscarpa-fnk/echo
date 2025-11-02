export const useApi = () => {
    const config = useRuntimeConfig()

    const apiFetch = async <T>(url: string, options: any = {}) => {
        const fullUrl = `${config.public.apiBase}${url}`

        return $fetch<T>(fullUrl, {
            ...options,
            credentials: 'include',
            headers: {
                ...options.headers,
            },
        })
    }

    return {
        apiFetch,
    }
}
