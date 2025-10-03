export default defineNuxtRouteMiddleware(() => {
    const { userId } = useAuth()

    if (!userId.value) {
        return navigateTo('/sign-in')
    }
})