# PP Tournament Manager

A professional poker tournament management application built with Nuxt 4, Ionic Vue, and TypeScript. Designed for tournament directors and poker clubs to manage live tournaments with real-time clock, player tracking, and seating management.

## Features

### **Tournament Management**
- **Live Tournament Clock** with customizable blind structures
- **Real-time player tracking** with registration and check-in status
- **Advanced seating management** with poker table visualization
- **Tournament overview** with activity feed and statistics
- **Multi-tournament support** with easy switching between events

### **Clock & Blinds**
- **Large countdown timer** with level progression
- **Blind structure display** with current and next levels
- **Break management** with automatic level advancement
- **Pause/resume functionality** for tournament control
- **Visual blind progression** with ante support

### **Player Management**
- **Player registration** with contact information
- **Search and filtering** by name, status, and table
- **Check-in tracking** with real-time status updates
- **Player elimination** and seat management
- **Registration statistics** and player counts

### **Seating System**
- **Visual poker table layout** with 9-seat configuration
- **Drag-and-drop player assignment** (planned)
- **Table balancing tools** for optimal player distribution
- **Seat management** with move and break table functions
- **Real-time seating chart** updates

### **Settings & Configuration**
- **Tournament customization** with buy-in and structure settings
- **Club management** with multiple venue support
- **User preferences** and display options
- **Export functionality** for results and reports

## Tech Stack

- **Frontend Framework**: [Nuxt 4](https://nuxt.com/) - The Intuitive Vue Framework
- **Mobile Framework**: [Ionic Vue 8](https://ionicframework.com/docs/vue/overview) - Cross-platform components
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first styling
- **Icons**: [Ionicons](https://ionic.io/ionicons) - Comprehensive icon library
- **State Management**: [Pinia](https://pinia.vuejs.org/) - Vue state management
- **Internationalization**: [Vue I18n](https://vue-i18n.intlify.dev/) - Multi-language support
- **Mobile**: [Capacitor 7](https://capacitorjs.com/) - Native mobile deployment

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

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

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
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

# Mobile Development
npx cap add ios      # Add iOS platform
npx cap add android  # Add Android platform
npx cap run ios      # Run on iOS simulator
npx cap run android  # Run on Android emulator
```

## Project Structure

```
pp-tournament-manager/
├── assets/
│   ├── css/
│   │   └── main.css           # Global styles & Ionic theme
│   └── images/
│       └── players/           # Player avatar images
├── components/
│   ├── TournamentHeader.vue   # Header with tournament selector
│   └── tournament/
│       ├── BlindStructure.vue # Blind levels display
│       ├── ClockPanel.vue     # Tournament timer
│       ├── OverviewPanel.vue  # Tournament overview cards
│       ├── PlayersList.vue    # Player management list
│       ├── PlayersToolbar.vue # Player search and filters
│       ├── RecentActivity.vue # Activity feed
│       ├── SeatingTableCard.vue # Poker table visualization
│       └── SeatingToolbar.vue # Seating management tools
├── composables/
│   ├── useAuth.ts            # Authentication logic
│   ├── useGraphQL.ts         # GraphQL client setup
│   ├── useI18n.ts            # Internationalization
│   ├── usePlayerAvatar.ts    # Player avatar management
│   ├── usePokerAPI.ts        # API integration
│   ├── useTournamentClock.ts # Clock functionality
│   └── useTournamentData.ts  # Tournament data management
├── i18n/
│   └── locales/
│       ├── en.json           # English translations
│       ├── fr.json           # French translations
│       └── nl.json           # Dutch translations
├── pages/
│   ├── login.vue             # Authentication page
│   └── tournament/
│       └── [id].vue          # Main tournament management page
├── stores/
│   └── useClubStore.ts       # Club data management
├── types/
│   ├── graphql.ts            # GraphQL type definitions
│   └── tournament.ts         # Tournament data models
├── app.vue                   # Root application component
├── capacitor.config.ts       # Capacitor configuration
├── ionic.config.json         # Ionic CLI configuration
└── nuxt.config.ts           # Nuxt configuration
```

## Design System

### Target Devices
- **Primary**: iPad in landscape mode (1024x768)
- **Secondary**: iPhone in portrait mode (375x812)

### Component Architecture
- **Ion-tabs**: Main navigation between tournament sections
- **Ion-cards**: Content containers with rounded corners
- **Ion-buttons**: Action buttons with consistent styling
- **Ion-badges**: Status indicators and counters
- **Ion-progress-bar**: Timer and progress indicators

### Key UI Patterns
- **3-column layout** for overview section
- **Large timer display** for clock section
- **Search and filter toolbar** for players section
- **Poker table visualization** for seating section
- **Simple card layout** for settings section

## Data Models

### Tournament Interface
```typescript
interface Tournament {
  id: string
  name: string
  status: 'upcoming' | 'running' | 'paused' | 'finished'
  registrations: number
  checkedIn: number
  maxPlayers: number
  currentLevel: number
  totalLevels: number
  timeRemaining: string
  blinds: string
  nextBlinds: string
  prizePool: string
}
```

### Player Interface
```typescript
interface Player {
  id: string
  name: string
  email: string
  phone: string
  status: 'registered' | 'checked-in' | 'seated' | 'eliminated'
  tableNumber?: number
  seatNumber?: number
  registrationTime: string
}
```

## Development Guidelines

### Code Style
- **Vue 3 Composition API** for all components
- **TypeScript strict mode** enabled
- **Tailwind CSS only** for styling (no custom CSS)
- **Ionic components** preferred over custom UI elements

### State Management
- **Composables** for business logic and API calls
- **Pinia stores** for global state management
- **Local state** for component-specific data

### Mobile Optimization
- **Touch-friendly** button sizes (44px minimum)
- **Responsive design** with breakpoints
- **Pull-to-refresh** on main content areas
- **Native scrolling** behavior

## API Integration

The application is designed to integrate with a GraphQL backend providing:

- **Tournament data** and live state management
- **Player registration** and check-in workflows
- **Real-time updates** via WebSocket subscriptions
- **Authentication** and user management
- **Club and venue** information

See `composables/usePokerAPI.ts` for complete API integration patterns.

## Authentication

The app supports JWT-based authentication with:

- **Login page** with username/password
- **Token storage** in secure storage
- **Route protection** via middleware
- **Automatic token refresh** handling

## Internationalization

Multi-language support with complete UI translations:

- **English** (`en`): Default language
- **French** (`fr`): Français interface  
- **Dutch** (`nl`): Nederlandse interface

Language selection persists across sessions and affects all UI elements including dates, numbers, and form validation messages.

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
3. Maintain Ionic component consistency
4. Test on both iPad and iPhone viewports
5. Update translations for all languages

## License

Private project for poker tournament management.

---

*Built for professional poker tournament management* 🃏