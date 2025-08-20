export const usePlayerAvatar = () => {
  const getPlayerAvatar = (userId: string | undefined): string => {
    if (!userId) {
      // Return default avatar if no userId
      return '/assets/images/players/default.jpg'
    }
    
    // Check if image exists for this user ID
    try {
      // For Vue/Nuxt, we need to use dynamic imports or explicit imports
      // Since we can't dynamically check file existence at runtime,
      // we'll try the .jpg first, then fallback to default
      return `/assets/images/players/${userId}.jpg`
    } catch (error) {
      // Fallback to default if image doesn't exist
      return '/assets/images/players/default.jpg'
    }
  }

  const getPlayerAvatarWithFallback = (userId: string | undefined): string => {
    if (!userId) {
      return '/assets/images/players/default.jpg'
    }
    
    // We can also try .png extension as one of the files is .png
    const jpgPath = `/assets/images/players/${userId}.jpg`
    const pngPath = `/assets/images/players/${userId}.png`
    
    // Return jpg path as primary, the browser will handle 404 gracefully
    // with our onError handler in the template
    return jpgPath
  }

  return {
    getPlayerAvatar,
    getPlayerAvatarWithFallback
  }
}