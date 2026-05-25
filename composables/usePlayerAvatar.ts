export const usePlayerAvatar = () => {
  const getPlayerAvatar = (userId: string | undefined): string => {
    if (!userId) {
      // Return default avatar if no userId
      return '/assets/images/players/default.jpg'
    }

    return `/assets/images/players/${userId}.jpg`
  }

  const getPlayerAvatarWithFallback = (userId: string | undefined): string => {
    if (!userId) {
      return '/assets/images/players/default.jpg'
    }

    // Browser handles 404 gracefully via the template's onError handler.
    return `/assets/images/players/${userId}.jpg`
  }

  return {
    getPlayerAvatar,
    getPlayerAvatarWithFallback,
  }
}
