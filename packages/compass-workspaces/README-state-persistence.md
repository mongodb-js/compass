# Workspace State Persistence

This implementation adds automatic persistence of workspace state (open tabs, active tab, etc.) to UserData storage when tabs are opened, closed, or modified.

## How it works

### Automatic Saving

- **Redux Middleware**: A custom middleware (`workspacesStateChangeMiddleware`) detects whenever the workspaces state changes
- **UserData Storage**: The state is automatically saved to persistent storage using MongoDB Compass's UserData system
- **File Format**: Uses EJSON serialization with Zod schema validation
- **Storage Location**: Saved under the key 'current-workspace' in WorkspacesState folder

### What gets saved

- All open tabs with their configuration:
  - Tab ID and type (Welcome, Shell, Collection, etc.)
  - Connection ID and namespace (for database/collection tabs)
  - Initial queries, aggregations, pipelines
  - Collection subtab selection (Documents, Schema, Indexes, etc.)
  - Shell evaluation state
- Active tab ID
- Timestamp of when state was saved

### State Restoration

- **Optional**: State restoration is provided via `configureStoreWithStateRestoration()` function
- **Fallback**: If restoration fails or no saved state exists, falls back to provided initial tabs
- **Logging**: Errors during restoration are logged for debugging

## Usage

### Basic (Existing behavior)

```typescript
// This continues to work as before - no automatic restoration
const store = configureStore(initialWorkspaceTabs, services);
```

### With Optional State Restoration

```typescript
// This will attempt to restore from UserData if no initial tabs provided
const store = await configureStoreWithStateRestoration(
  initialWorkspaceTabs,
  services,
  true // enable restoration
);
```

### Manual State Loading

```typescript
import { loadWorkspaceStateFromUserData } from './stores/workspaces-middleware';

const savedState = await loadWorkspaceStateFromUserData();
if (savedState) {
  console.log('Found saved workspace state:', savedState);
}
```

## Files Added/Modified

### New Files

- `workspaces-storage.ts` - Zod schemas for UserData validation
- `workspaces-middleware.ts` - Redux middleware and storage functions

### Modified Files

- `index.ts` - Added new store configuration function with restoration
- Existing store configuration remains unchanged for backward compatibility

## Error Handling

- **Non-blocking**: Errors during saving/loading won't break the application
- **Graceful degradation**: If restoration fails, app continues with provided initial tabs
- **Console logging**: Errors are logged for debugging (only in development for saves)

## Storage Schema

The saved state follows this structure:

```typescript
{
  tabs: Array<{
    id: string;
    type: "Welcome" | "My Queries" | "Shell" | "Collection" | ...;
    connectionId?: string;
    namespace?: string;
    initialQuery?: Record<string, any>;
    // ... other optional fields
  }>;
  activeTabId: string | null;
  timestamp: number;
}
```

## Development Notes

- The middleware runs on every Redux state change, but only saves if the state actually changed
- Saving is async and non-blocking (fire-and-forget)
- The schema allows for optional fields, gracefully handling different workspace types
- Type conversion ensures compatibility between runtime types and storage schema
