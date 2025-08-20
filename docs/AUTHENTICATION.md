# Authentication System

This document describes the authentication system implemented for the PocketPair mobile application.

## Overview

The app supports both authenticated and guest access:
- **Guest users** can browse tournaments and leaderboards
- **Authenticated users** get access to personal features like registrations, tournament history, and profile management

## Features

### Authentication Methods
1. **Email/Password Login** - Traditional login with credentials
2. **Google OAuth** - Social login integration
3. **Registration** - Create new accounts with email verification
4. **Guest Access** - Browse public content without signing up

### Protected Routes
The following pages require authentication:
- `/registrations` - User's tournament registrations
- `/tournament-history` - Personal tournament history
- `/friends` - Friends management

### Public Routes
These pages are accessible to everyone:
- `/` - Home page
- `/tournaments` - Browse tournaments
- `/leaderboard` - View leaderboards
- `/tournament/[id]` - Tournament details
- `/login` - Login page
- `/register` - Registration page

## Implementation

### Core Files

1. **`composables/useAuth.ts`** - Main authentication composable
   - Manages auth state (user, token, login status)
   - Provides login, register, logout methods
   - Handles Google OAuth integration
   - Stores auth data in localStorage/sessionStorage

2. **`middleware/auth.ts`** - Route protection middleware
   - Redirects unauthenticated users to login page
   - Applied to protected routes via `definePageMeta`

3. **`pages/login.vue`** - Login page
   - Email/password form with validation
   - Google OAuth button
   - "Remember me" option
   - Link to registration and guest access

4. **`pages/register.vue`** - Registration page
   - User registration form with validation
   - Password strength requirements
   - Terms and conditions acceptance
   - Google OAuth option

### Auth State Management

The authentication state is managed globally and persists across app restarts:

```typescript
// Check authentication status
const { isAuthenticated, currentUser } = useAuth()

// Login
const user = await login({ email, password }, rememberMe)

// Register
const user = await register({ username, email, password })

// Logout
await logout()
```

### Conditional UI

Components conditionally show features based on authentication:

```vue
<!-- Only show for authenticated users -->
<div v-if="isAuthenticated">
  <UserProfile />
</div>

<!-- Navigation adapts to auth status -->
<IonTabButton 
  v-if="isAuthenticated"
  tab="registrations"
>
  My Seats
</IonTabButton>
```

## Configuration

### Environment Variables

Set these in your `.env` file:

```bash
# Authentication API URLs
NUXT_AUTH_BASE_URL={{baseBackendUrl}}
NUXT_AUTH_REGISTER_URL={{baseBackendUrl}}/oauth/register
NUXT_AUTH_LOGIN_URL={{baseBackendUrl}}/oauth/login
```

### Backend Integration

The system expects these backend endpoints:

1. **POST `/oauth/login`** - Email/password login
   ```json
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```

2. **POST `/oauth/register`** - User registration
   ```json
   {
     "username": "johndoe",
     "email": "john@example.com", 
     "password": "password"
   }
   ```

3. **GraphQL mutations** for authentication (fallback)
   - `login(email: String!, password: String!)`
   - `register(input: RegisterInput!)`
   - `googleAuth(token: String!)`
   - `logout`

## User Experience

### Guest Flow
1. User opens app → sees public content
2. Can browse tournaments and leaderboards
3. Profile tab shows "Login" instead of user profile
4. Clicking protected features redirects to login

### Login Flow
1. User clicks "Login" → login page
2. Enters credentials or uses Google OAuth
3. On success → redirects to intended page or home
4. Profile tab updates to show user info

### Registration Flow
1. User clicks "Register" → registration page
2. Fills form with password requirements
3. Accepts terms and conditions
4. On success → welcome message and redirect to home

### Logout Flow
1. User clicks logout in settings
2. Confirms logout action
3. Auth state cleared, redirected to login page

## Security Features

- JWT token-based authentication
- Secure storage of credentials
- Password strength validation
- Route protection middleware
- Automatic token cleanup on logout
- GraphQL cache clearing on auth changes

## Testing

To test the authentication system:

1. **Guest Access**: Open app without login
   - Verify public pages work
   - Check protected routes redirect to login
   - Confirm navigation adapts to guest status

2. **Login Flow**: Use login page
   - Test email/password validation
   - Verify "remember me" functionality
   - Check redirect after successful login

3. **Registration**: Create new account
   - Test form validation
   - Verify password requirements
   - Check terms acceptance requirement

4. **Logout**: Sign out from profile
   - Confirm state clears properly
   - Verify redirect to login page
   - Check that protected routes are inaccessible

## Future Enhancements

- Email verification on registration
- Password reset functionality
- Biometric authentication (fingerprint/face ID)
- Social login with Facebook, Apple
- Multi-factor authentication
- Session management and timeout