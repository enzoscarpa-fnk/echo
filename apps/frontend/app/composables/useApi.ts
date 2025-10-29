export const useApi = () => {
    const config = useRuntimeConfig()

    const apiFetch = async <T>(url: string, options: any = {}) => {
        const fullUrl = `${config.public.apiBase}${url}`
        console.log('🔧 [useApi] apiBase:', config.public.apiBase)
        console.log('🔧 [useApi] url param:', url)
        console.log('🔧 [useApi] Full URL:', fullUrl)

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
