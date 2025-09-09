import type { Middleware, AnyAction } from 'redux';
import type { WorkspacesState } from './workspaces';
import { FileUserData } from '@mongodb-js/compass-user-data';
import { EJSON } from 'bson';
import {
  WorkspacesStateSchema,
  type WorkspacesStateData,
} from './workspaces-storage';

// Create a UserData instance for storing workspace state
const workspacesUserData = new FileUserData(
  WorkspacesStateSchema,
  'WorkspacesState',
  {
    serialize: (content) => EJSON.stringify(content, undefined, 2),
    deserialize: (content: string) => EJSON.parse(content),
  }
);

/**
 * Middleware that runs a callback whenever the workspaces state changes.
 * This allows you to perform side effects when the state is updated.
 */
export const workspacesStateChangeMiddleware: Middleware<
  Record<string, never>,
  WorkspacesState
> = (store) => (next) => (action: AnyAction) => {
  console.log('WOKRSPEF');
  const prevState = store.getState();
  const result = next(action);
  const nextState = store.getState();

  // Only call the callback if the workspaces state actually changed
  if (prevState !== nextState) {
    // Fire and forget - don't await to avoid blocking the action
    void onWorkspacesStateChange(nextState, action);
  }

  return result;
};

/**
 * Called whenever the workspaces state changes
 */
function onWorkspacesStateChange(newState: WorkspacesState, action: AnyAction) {
  // Save the workspace state to UserData (async, fire and forget)
  void saveWorkspaceStateToUserData(newState, action);
}

/**
 * Saves the workspace state to persistent storage using UserData
 */
async function saveWorkspaceStateToUserData(
  state: WorkspacesState,
  action: AnyAction
) {
  try {
    // Transform the state to the format we want to save
    const stateToSave: WorkspacesStateData = {
      tabs: state.tabs.map((tab) => {
        const baseTab = {
          id: tab.id,
          type: tab.type,
        };

        // Add optional fields conditionally
        const result: WorkspacesStateData['tabs'][0] = { ...baseTab };

        if ('connectionId' in tab && tab.connectionId) {
          result.connectionId = tab.connectionId;
        }
        if ('namespace' in tab && tab.namespace) {
          result.namespace = tab.namespace;
        }
        if ('initialQuery' in tab && tab.initialQuery) {
          // Store as record, accepting unknown format
          result.initialQuery = tab.initialQuery as Record<string, unknown>;
        }
        if ('initialAggregation' in tab && tab.initialAggregation) {
          result.initialAggregation = tab.initialAggregation as Record<
            string,
            unknown
          >;
        }
        if ('initialPipeline' in tab && tab.initialPipeline) {
          result.initialPipeline = tab.initialPipeline as Array<
            Record<string, unknown>
          >;
        }
        if ('initialPipelineText' in tab && tab.initialPipelineText) {
          result.initialPipelineText = tab.initialPipelineText;
        }
        if ('editViewName' in tab && tab.editViewName) {
          result.editViewName = tab.editViewName;
        }
        if ('initialEvaluate' in tab && tab.initialEvaluate) {
          result.initialEvaluate = tab.initialEvaluate;
        }
        if ('initialInput' in tab && tab.initialInput) {
          result.initialInput = tab.initialInput;
        }
        if ('subTab' in tab && tab.subTab) {
          // Validate that subTab is one of the allowed values
          const validSubTabs = [
            'Documents',
            'Aggregations',
            'Schema',
            'Indexes',
            'Validation',
            'GlobalWrites',
          ];
          if (validSubTabs.includes(tab.subTab as string)) {
            result.subTab = tab.subTab as
              | 'Documents'
              | 'Aggregations'
              | 'Schema'
              | 'Indexes'
              | 'Validation'
              | 'GlobalWrites';
          }
        }

        return result;
      }),
      activeTabId: state.activeTabId,
      timestamp: Date.now(),
    };

    // Save to UserData with a fixed ID
    await workspacesUserData.write('current-workspace', stateToSave);

    // Optional: Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Workspace state saved to UserData:', {
        actionType: action.type,
        tabCount: state.tabs.length,
        activeTabId: state.activeTabId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Don't throw errors from the middleware to avoid breaking the app
    // eslint-disable-next-line no-console
    console.error('Failed to save workspace state to UserData:', error);
  }
}

/**
 * Loads the workspace state from persistent storage
 */
export async function loadWorkspaceStateFromUserData(): Promise<WorkspacesStateData | null> {
  try {
    const savedState = await workspacesUserData.readOne('current-workspace', {
      ignoreErrors: true,
    });
    console.log('Loaded saved state', savedState);
    return savedState || null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load workspace state from UserData:', error);
    return null;
  }
}

/**
 * Converts saved workspace state data back to OpenWorkspaceOptions format
 * for initializing the store
 */
export function convertSavedStateToInitialTabs(
  savedState: WorkspacesStateData
): Array<Record<string, unknown>> {
  return savedState.tabs.map((tab) => {
    const baseTab: Record<string, unknown> = { type: tab.type };

    // Add connection-related fields
    if (tab.connectionId) {
      baseTab.connectionId = tab.connectionId;
    }
    if (tab.namespace) {
      baseTab.namespace = tab.namespace;
    }

    // Add optional fields based on workspace type
    if (tab.initialQuery) {
      baseTab.initialQuery = tab.initialQuery;
    }
    if (tab.initialAggregation) {
      baseTab.initialAggregation = tab.initialAggregation;
    }
    if (tab.initialPipeline) {
      baseTab.initialPipeline = tab.initialPipeline;
    }
    if (tab.initialPipelineText) {
      baseTab.initialPipelineText = tab.initialPipelineText;
    }
    if (tab.editViewName) {
      baseTab.editViewName = tab.editViewName;
    }
    if (tab.initialEvaluate) {
      baseTab.initialEvaluate = tab.initialEvaluate;
    }
    if (tab.initialInput) {
      baseTab.initialInput = tab.initialInput;
    }
    if (tab.subTab) {
      baseTab.initialSubtab = tab.subTab;
    }

    return baseTab;
  });
}
