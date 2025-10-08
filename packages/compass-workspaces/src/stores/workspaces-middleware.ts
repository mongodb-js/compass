import type { Middleware, AnyAction } from 'redux';
import type { WorkspacesState } from './workspaces';
import type {
  WorkspacesStateData,
  WorkspaceTabData,
} from '../services/workspaces-storage';
import type { WorkspacesServices } from '..';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';

/**
 * Debounced handler to save the workspaces state.
 */
const handleWorkspacesStateChange = (() => {
  let timeoutId: NodeJS.Timeout;
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
  services: WorkspacesServices
): Middleware<Record<string, never>, WorkspacesState> {
  return (store) => (next) => (action: AnyAction) => {
    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();

    // Only call the callback if the workspaces state actually changed
    if (prevState !== nextState) {
      handleWorkspacesStateChange(nextState, services);
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
      tabs: state.tabs.map((tab) => {
        const { type, id } = tab;

        switch (type) {
          case 'Welcome':
          case 'My Queries':
          case 'Data Modeling':
            return { id, type };
          case 'Databases':
          case 'Performance':
            return {
              id,
              type,
              connectionId: tab.connectionId,
            };
          case 'Collections':
            return {
              id,
              type,
              connectionId: tab.connectionId,
              namespace: tab.namespace,
            };
          case 'Shell': {
            const result: WorkspaceTabData = {
              id,
              type,
              connectionId: tab.connectionId,
            };
            if ('initialEvaluate' in tab) {
              result.initialEvaluate = tab.initialEvaluate;
            }
            if ('initialInput' in tab) {
              result.initialInput = tab.initialInput;
            }
            return result;
          }
          case 'Collection': {
            const result: WorkspaceTabData = {
              id,
              type,
              connectionId: tab.connectionId,
              namespace: tab.namespace,
              subTab: tab.subTab,
            };
            if ('initialQuery' in tab) {
              result.initialQuery = tab.initialQuery as Record<string, unknown>;
            }
            if ('initialAggregation' in tab) {
              result.initialAggregation = tab.initialAggregation as Record<
                string,
                unknown
              >;
            }
            if ('editViewName' in tab) {
              result.editViewName = tab.editViewName;
            }
            if ('initialPipeline' in tab) {
              result.initialPipeline = tab.initialPipeline as Array<
                Record<string, unknown>
              >;
            }
            if ('initialPipelineText' in tab) {
              result.initialPipelineText = tab.initialPipelineText;
            }
            return result;
          }
        }
      }),
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
