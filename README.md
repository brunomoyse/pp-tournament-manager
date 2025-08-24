# PP Tournament Manager

A professional poker tournament management application built with Nuxt 4, Ionic Vue, and TypeScript. Designed for tournament directors and poker clubs to manage live tournaments with real-time clock, player tracking, and seating management.

## Features

### **Dashboard & Home**
- **Tournament overview** with active tournaments display
- **Recent tournaments list** with compact, sorted view (by start time)
- **Statistics dashboard** with player and tournament metrics
- **Quick actions** for creating tournaments and managing players

### **Tournament Management**
- **Live tournament display** with detailed tournament information
- **Real-time tournament status** tracking (UPCOMING, IN_PROGRESS, COMPLETED)
- **Tournament structure** with blind levels and timing
- **Player registration** and tournament participation tracking
- **Multi-tournament support** with easy navigation

### **Clock & Blinds**
- **Tournament clock** with real-time countdown
- **Blind structure progression** with current and next levels
- **Clock controls** (start, pause, resume, advance level)
- **Break management** with automatic timing
- **Level progression** with ante support

### **Player Management**  
- **Player registration** with comprehensive player data
- **Tournament players list** with search and filtering
- **Seating chart management** with table assignments
- **Player status tracking** throughout tournaments
- **Seating history** and player movement tracking

### **Seating System**
- **Visual poker table layout** with seat assignments
- **Table management** with assignment and balancing
- **Seat assignment tracking** with stack sizes
- **Unassigned players management**
- **Real-time seating updates**

### **Authentication & Clubs**
- **JWT-based authentication** with secure login
- **Club management** with automatic club selection from login
- **User profile management** with role-based access
- **Multi-club support** for tournament directors

## Tech Stack

- **Frontend Framework**: [Nuxt 4](https://nuxt.com/) - The Intuitive Vue Framework
- **Mobile Framework**: [Ionic Vue 8](https://ionicframework.com/docs/vue/overview) - Cross-platform components
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first styling
- **GraphQL**: [GraphQL-Request](https://github.com/jasonkuhrt/graphql-request) with auto-generated types
- **Icons**: [Ionicons](https://ionic.io/ionicons) - Comprehensive icon library
- **State Management**: [Pinia](https://pinia.vuejs.org/) - Vue state management with persistence
- **Internationalization**: [Vue I18n](https://vue-i18n.intlify.dev/) - Multi-language support
- **Mobile**: [Capacitor 7](https://capacitorjs.com/) - Native mobile deployment

## GraphQL Integration

The application uses a fully-typed GraphQL client with:

- **Auto-generated TypeScript types** from GraphQL schema
- **Query & Mutation operations** for all tournament management
- **Real-time subscriptions** for tournament clock and registrations
- **Optimistic updates** and caching for smooth UX
- **Error handling** and loading states

### Key GraphQL Operations
- `GetTournaments` - Fetch tournaments with filtering
- `GetTournament` - Single tournament with full details
- `GetTournamentPlayers` - Player registration data
- `GetTournamentClock` - Real-time clock information
- `TournamentClockUpdates` - Live clock subscription
- `LoginUser` - Authentication with club data

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- GraphQL backend server running

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pp-tournament-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure GraphQL endpoint**
   ```bash
   # Update nuxt.config.ts with your GraphQL endpoint
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run generate     # Generate static site

# Code Generation
npm run codegen      # Generate GraphQL types (if configured)

# Mobile Development
npx cap add ios      # Add iOS platform
npx cap add android  # Add Android platform
npx cap run ios      # Run on iOS simulator
npx cap run android  # Run on Android emulator
```

## Project Structure

```
pp-tournament-manager/
├── .nuxt/                    # Generated Nuxt files
│   └── gql/                  # Generated GraphQL types
├── assets/
│   └── css/
│       └── main.css          # Global styles & Ionic theme
├── components/
│   └── tournament/
│       ├── overview/         # Tournament overview components
│       ├── players/          # Player management components
│       └── seating/          # Seating chart components
├── composables/
│   ├── useI18n.ts           # Internationalization
│   ├── usePlayerAvatar.ts   # Player avatar management
│   ├── useNetworkStatus.ts  # Network connectivity
│   └── useGqlSubscription.ts # GraphQL subscriptions
├── graphql/
│   ├── queries/             # GraphQL query definitions
│   │   ├── tournament.gql
│   │   └── club.gql
│   └── mutations/           # GraphQL mutation definitions
│       ├── tournament.gql
│       └── auth.gql
├── middleware/
│   └── auth.ts              # Authentication middleware
├── pages/
│   ├── index.vue            # Dashboard/home page
│   ├── login.vue            # Authentication page
│   └── tournament/
│       └── [id]/
│           └── index.vue    # Tournament management page
├── plugins/
│   ├── auth.client.ts       # Auth plugin initialization
│   ├── graphql-ws.client.ts # GraphQL WebSocket setup
│   └── i18n.client.ts       # I18n plugin setup
├── stores/
│   ├── useAuthStore.ts      # Authentication state
│   ├── useClubStore.ts      # Club management state
│   └── useTournamentStore.ts # Tournament state
├── types/
│   ├── graphql.ts           # GraphQL type definitions
│   ├── tournament.ts        # Tournament data models
│   ├── user.ts              # User and club types
│   └── clock.ts             # Tournament clock types
├── app.vue                  # Root application component
├── capacitor.config.ts      # Capacitor configuration
└── nuxt.config.ts          # Nuxt configuration with GraphQL
```

## Design System

### Color Scheme
- **Primary Background**: `#18181a` (Dark theme)
- **Secondary Background**: `#24242a` 
- **Accent Gold**: Custom gold color for highlights
- **Border Colors**: Subtle borders with opacity
- **Text Colors**: Primary white with opacity variants

### Target Devices
- **Primary**: iPad in landscape mode (1024x768)
- **Secondary**: iPhone in portrait mode (375x812)
- **Desktop**: Full responsive support

### Component Architecture
- **Ion-page**: Full-screen containers
- **Ion-content**: Scrollable content areas  
- **Custom cards**: Tournament and player information
- **Ion-buttons**: Action buttons with consistent styling
- **Ion-icons**: Ionicons throughout the interface

### Key UI Patterns
- **Dashboard cards**: 3-column grid layout for statistics
- **Compact lists**: Tournament and player listings
- **Status badges**: Color-coded tournament status
- **Touch-friendly**: Large buttons and interactive areas

## Data Models

### Tournament (GraphQL)
```typescript
interface Tournament {
  id: string
  title: string
  description?: string | null
  clubId: string
  startTime: any
  endTime?: any | null
  buyInCents: number
  seatCap?: number | null
  status: TournamentStatus
  liveStatus: TournamentLiveStatus
  createdAt: any
  updatedAt: any
}

enum TournamentStatus {
  UPCOMING = 'UPCOMING'
  IN_PROGRESS = 'IN_PROGRESS' 
  COMPLETED = 'COMPLETED'
}
```

### User & Club
```typescript
interface User {
  id: string
  email: string
  username?: string | null
  firstName: string
  lastName?: string | null
  role: Role
  managedClub?: Club | null
}

interface Club {
  id: string
  name: string
  city?: string
}
```

## Development Guidelines

### Code Style
- **Vue 3 Composition API** for all components
- **TypeScript strict mode** enabled
- **Tailwind CSS** for styling with custom PP theme
- **Ionic components** with custom styling integration

### State Management
- **Pinia stores** with persistence for auth, club, and tournament data
- **GraphQL client** with auto-generated types
- **Composables** for reusable business logic
- **Local component state** for UI-specific data

### Localization
- **Belgian-French locale** (fr-BE) for number and date formatting
- **Euro currency formatting** with proper locale support
- **Vue I18n** ready for multi-language expansion

## Authentication Flow

1. **Login page** with email/password
2. **JWT token storage** in Pinia with persistence
3. **GraphQL client** token injection
4. **Automatic club selection** from user's managedClub
5. **Route protection** via auth middleware
6. **Token refresh** handling

## GraphQL Features

### Type Safety
- Fully generated TypeScript types from schema
- Type-safe query and mutation functions
- Automatic client generation with proper typing

### Real-time Features
- Tournament clock subscriptions
- Player registration updates
- Live tournament status changes

### Error Handling
- GraphQL error parsing and display
- Network status monitoring
- Optimistic updates with rollback

## Deployment

### Web Deployment
```bash
npm run build
npm run preview
```

### Mobile Deployment
```bash
npm run build
npx cap copy
npx cap open ios    # For iOS
npx cap open android # For Android
```

## Contributing

1. Follow Vue 3 Composition API patterns
2. Use TypeScript for all new code
3. Maintain GraphQL schema compatibility
4. Test on both iPad and iPhone viewports
5. Follow Ionic design patterns with custom styling
6. Use Pinia for state management
7. Implement proper error handling

## License

Private project for poker tournament management.

---

*Built for professional poker tournament management* 🃏