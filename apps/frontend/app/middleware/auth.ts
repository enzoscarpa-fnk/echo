export default defineNuxtRouteMiddleware(() => {
    const { isLoaded, isSignedIn } = useAuth()

    // Wait for auth to load
    if (!isLoaded.value) {
        return
    }

    // Redirect to home if not signed in
    if (!isSignedIn.value) {
        return navigateTo('/')
    }
})