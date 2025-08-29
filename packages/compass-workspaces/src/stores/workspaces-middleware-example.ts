/**
 * EXAMPLE USAGE OF WORKSPACES MIDDLEWARE
 *
 * This file shows how you can implement custom logic in the single callback.
 * You can copy this implementation into the workspaces-middleware.ts file and
 * customize it for your specific needs.
 */

import type { AnyAction } from 'redux';
import type { WorkspacesState } from './workspaces';

/**
 * Example implementation for the workspaces state change callback
 */
function exampleOnWorkspacesStateChange(
  newState: WorkspacesState,
  action: AnyAction
) {
  // Example: Save the entire state to persistent storage
  // userDataService.saveWorkspacesState(newState);

  // Example: Send analytics about current workspace state
  // analyticsService.track('workspaces_state_changed', {
  //   action_type: action.type,
  //   total_tabs: newState.tabs.length,
  //   active_tab_type: getActiveTabType(newState),
  //   timestamp: new Date().toISOString(),
  // });

  // Example: Update window title based on active tab
  updateWindowTitle(newState);

  // Example: Auto-save current workspace configuration
  // configService.saveWorkspaceLayout(newState);

  // Example: Update browser history or URL based on active tab
  // updateBrowserState(newState);

  console.log('Workspaces state changed:', {
    actionType: action.type,
    totalTabs: newState.tabs.length,
    activeTabId: newState.activeTabId,
    activeTabType: getActiveTabType(newState),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper function to get the type of the currently active tab
 */
function getActiveTabType(state: WorkspacesState): string | null {
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
  return activeTab?.type || null;
}

/**
 * Helper function to update the window title based on the active tab
 */
function updateWindowTitle(state: WorkspacesState) {
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);

  if (!activeTab) {
    document.title = 'MongoDB Compass';
    return;
  }

  const title = getTabTitle(activeTab);
  document.title = `MongoDB Compass - ${title}`;
}

/**
 * Helper function to get a human-readable title for a tab
 */
function getTabTitle(tab: WorkspacesState['tabs'][0]): string {
  switch (tab.type) {
    case 'Welcome':
      return 'Welcome';
    case 'My Queries':
      return 'My Queries';
    case 'Shell':
      return 'Shell';
    case 'Databases':
      return 'Databases';
    case 'Performance':
      return 'Performance';
    case 'Collections':
      return `Collections - ${'namespace' in tab ? tab.namespace : ''}`;
    case 'Collection':
      return `${'namespace' in tab ? tab.namespace : ''} - ${
        'subTab' in tab ? tab.subTab : 'Documents'
      }`;
    default:
      return 'MongoDB Compass';
  }
}
