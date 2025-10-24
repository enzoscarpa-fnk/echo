export const useAuth = () => {
    const { getToken, user, isLoaded, isSignedIn } = useUser()

    return {
        getToken,
        user,
        isLoaded,
        isSignedIn,
    }
}
