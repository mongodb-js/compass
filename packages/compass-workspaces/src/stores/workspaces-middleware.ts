import type { Middleware, AnyAction } from 'redux';
import type { WorkspacesState } from './workspaces';
import type { WorkspacesStateData } from '../types';
import type { WorkspacesServices } from '..';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';

/**
 * Debounced handler to save the workspaces state.
 */
const handleWorkspacesStateChange = (() => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (state: WorkspacesState, services: WorkspacesServices) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      // Fire and forget - don't await to avoid blocking the action
      void saveWorkspaceStateToUserData(state, services);
    }, 250);
  };
})();

/**
 * Middleware that runs a callback whenever the workspaces state changes.
 * This allows you to perform side effects when the state is updated.
 */
export function workspacesStateChangeMiddleware(
  services: WorkspacesServices,
  shouldSaveWorkspaces?: () => boolean
): Middleware<Record<string, never>, WorkspacesState> {
  return (store) => (next) => (action: AnyAction) => {
    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();

    // Only call the callback if the workspaces state actually changed
    if (prevState !== nextState) {
      if (
        services.preferences.getPreferences().enableRestoreWorkspaces &&
        shouldSaveWorkspaces?.()
      ) {
        handleWorkspacesStateChange(nextState, services);
      }
    }

    return result;
  };
}

/**
 * Saves the workspace state to persistent storage using UserData
 */
async function saveWorkspaceStateToUserData(
  state: WorkspacesState,
  services: WorkspacesServices
) {
  try {
    // Transform the state to the format we want to save
    const stateToSave: WorkspacesStateData = {
      tabs: state.tabs.filter((tab) => tab.type !== 'Welcome'), // Don't save welcome tabs
      activeTabId: state.activeTabId,
      timestamp: Date.now(),
    };

    // Save to UserData with a fixed ID
    await services.userData.write('saved-workspaces', stateToSave);
  } catch (error) {
    services.logger.log.error(
      mongoLogId(1_001_000_229),
      'Workspaces middleware',
      'Failed to save workspace state to UserData',
      { error }
    );
  }
}
