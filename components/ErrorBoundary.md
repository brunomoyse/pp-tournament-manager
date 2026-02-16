# ErrorBoundary Component

A reusable error boundary component for gracefully handling component errors in the PocketPair Tournament Manager app.

## Features

- Catches and displays component errors using Vue's `onErrorCaptured` hook
- User-friendly error messages with i18n support (en, fr, nl)
- Optional error details toggle for debugging
- Retry and reset functionality
- Consistent dark theme styling
- Error event emission for logging

## Usage

### Basic Usage

Wrap any component that might throw errors:

```vue
<template>
  <ErrorBoundary>
    <YourComponent />
  </ErrorBoundary>
</template>
```

### With Custom Message

```vue
<ErrorBoundary fallback-message="Failed to load tournament data">
  <TournamentDetail />
</ErrorBoundary>
```

### With Retry Function

```vue
<template>
  <ErrorBoundary :on-retry="handleRetry">
    <TournamentClockCard />
  </ErrorBoundary>
</template>

<script setup lang="ts">
const handleRetry = async () => {
  // Refetch data or reinitialize component
  await fetchTournamentData()
}
</script>
```

### With Error Logging

```vue
<ErrorBoundary @error="logError">
  <SeatingManager />
</ErrorBoundary>

<script setup lang="ts">
const logError = (error: Error) => {
  console.error('Seating error:', error)
  // Send to error tracking service
}
</script>
```

### Full Example

```vue
<template>
  <ErrorBoundary
    fallback-message="Failed to load tournament clock"
    show-details
    show-reset
    :on-retry="refetchClock"
    :on-reset="resetClock"
    @error="logClockError"
  >
    <TournamentClockCard :tournament-id="tournamentId" />
  </ErrorBoundary>
</template>

<script setup lang="ts">
const refetchClock = async () => {
  await GqlGetTournamentClock({ id: tournamentId })
}

const resetClock = () => {
  // Reset local state
  clockData.value = null
}

const logClockError = (error: Error) => {
  console.error('[Clock Error]', error)
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fallbackMessage` | `string` | `undefined` | Custom error message to display instead of error.message |
| `showDetails` | `boolean` | `false` | Show "Show Details" button to reveal error stack trace |
| `showReset` | `boolean` | `false` | Show "Reset" button alongside "Retry" |
| `onRetry` | `() => void \| Promise<void>` | `undefined` | Function to call when user clicks "Retry" |
| `onReset` | `() => void` | `undefined` | Function to call when user clicks "Reset" |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `error` | `Error` | Emitted when an error is caught. Use for logging or analytics. |

## Recommended Usage Locations

Wrap these critical sections with ErrorBoundary:

1. **Tournament Clock Display**
   ```vue
   <ErrorBoundary :on-retry="refetchClock">
     <TournamentClockCard />
   </ErrorBoundary>
   ```

2. **Seating Manager**
   ```vue
   <ErrorBoundary fallback-message="Failed to load seating chart">
     <TournamentSeatingManager />
   </ErrorBoundary>
   ```

3. **GraphQL Mutation Forms**
   ```vue
   <ErrorBoundary :on-retry="resetForm">
     <PlayerFormModal />
   </ErrorBoundary>
   ```

4. **Subscription Components**
   ```vue
   <ErrorBoundary show-reset :on-reset="reconnect">
     <LiveNotifications />
   </ErrorBoundary>
   ```

5. **Page-Level Wrapping**
   ```vue
   <!-- pages/tournament/[id]/index.vue -->
   <template>
     <ion-page>
       <ErrorBoundary>
         <!-- page content -->
       </ErrorBoundary>
     </ion-page>
   </template>
   ```

## i18n Keys

The component uses these translation keys:

- `error.boundary.title` - Error title
- `error.boundary.defaultMessage` - Default error message
- `error.boundary.retryFailed` - Message shown when retry fails
- `error.boundary.retry` - Retry button text
- `error.boundary.reset` - Reset button text
- `error.boundary.showDetails` - Show details button text
- `error.boundary.hideDetails` - Hide details button text

## Styling

The component uses the existing design system:

- Dark theme colors (`#24242a`, `#18181a`)
- Border color (`#54545f`)
- Error color (`#ef4444`)
- Accent color (`#fee78a`)
- Text colors (`#e2e8f0`, `#94a3b8`)
- Existing button classes (`pp-action-button--primary`, `pp-action-button--secondary`)

## Development Mode

In development, errors are logged to the console with full context:

```js
console.error('[ErrorBoundary] Caught error:', {
  error: err,
  instance, // Vue component instance
  info,     // Error info (lifecycle hook, etc.)
})
```

## Notes

- Errors are prevented from propagating further up the component tree
- The component resets its error state when retry/reset is triggered
- If retry fails, the error is caught and displayed again
- Error details (stack trace) are only shown when `showDetails={true}`
