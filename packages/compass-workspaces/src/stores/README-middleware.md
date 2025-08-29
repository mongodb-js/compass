# Workspaces Middleware

This middleware allows you to perform actions/callbacks whenever the workspaces state changes, such as when tabs are opened, closed, or modified.

## How it works

The middleware intercepts every Redux action and compares the previous and next workspaces state. If the state has actually changed, it calls a single callback function with the new state and the action that caused the change.

## Integration

The middleware is already integrated into the Redux store in `index.ts`:

```typescript
import { workspacesStateChangeMiddleware } from './stores/workspaces-middleware';

// In configureStore function:
applyMiddleware(
  thunk.withExtraArgument(services),
  workspacesStateChangeMiddleware
);
```

## Customization

To implement your custom logic, edit the callback function in `workspaces-middleware.ts`:

```typescript
function onWorkspacesStateChange(newState: WorkspacesState, action: AnyAction) {
  // TODO: Implement your callback logic here
  // You have access to:
  // - newState: The complete new workspaces state
  // - action: The Redux action that triggered the change
}
```

The callback receives:

- `newState`: The complete new `WorkspacesState` object
- `action`: The Redux action that caused the state change

## Example Use Cases

- **Save state**: Persist the entire workspaces state to user data
- **Analytics**: Track workspace usage and state changes
- **Auto-save**: Save workspace configuration whenever it changes
- **Window title**: Update browser title based on active tab
- **URL sync**: Update browser URL to reflect current workspace
- **Logging**: Log all workspace state changes for debugging

## Guaranteed Behavior

- The callback is **only called when the state actually changes** (strict reference equality check)
- The callback receives the **complete new state**, so you can access all tabs, active tab, and metadata
- The callback is called **after** the state has been updated but **before** the action completes

See `workspaces-middleware-example.ts` for detailed implementation examples.
