import type { Reducer, AnyAction, Action } from 'redux';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { experimentationServiceLocator } from '@mongodb-js/compass-telemetry/provider';
import { MockDataGeneratorStep } from '../components/mock-data-generator-modal/types';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

type CollectionThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  CollectionState,
  {
    localAppRegistry: AppRegistry;
    dataService: DataService;
    workspaces: ReturnType<typeof workspacesServiceLocator>;
    experimentationServices: ReturnType<typeof experimentationServiceLocator>;
  },
  A
>;

export type CollectionState = {
  workspaceTabId: string;
  namespace: string;
  metadata: CollectionMetadata | null;
  editViewName?: string;
  mockDataGenerator: {
    isModalOpen: boolean;
    currentStep: MockDataGeneratorStep;
  };
};

enum CollectionActions {
  CollectionMetadataFetched = 'compass-collection/CollectionMetadataFetched',
  OpenMockDataGeneratorModal = 'compass-collection/OpenMockDataGeneratorModal',
  CloseMockDataGeneratorModal = 'compass-collection/CloseMockDataGeneratorModal',
  SetMockDataGeneratorStep = 'compass-collection/SetMockDataGeneratorStep',
}

interface CollectionMetadataFetchedAction {
  type: CollectionActions.CollectionMetadataFetched;
  metadata: CollectionMetadata;
}

interface OpenMockDataGeneratorModalAction {
  type: CollectionActions.OpenMockDataGeneratorModal;
}

interface CloseMockDataGeneratorModalAction {
  type: CollectionActions.CloseMockDataGeneratorModal;
}

interface SetMockDataGeneratorStepAction {
  type: CollectionActions.SetMockDataGeneratorStep;
  step: MockDataGeneratorStep;
}

const reducer: Reducer<CollectionState, Action> = (
  state = {
    // TODO(COMPASS-7782): use hook to get the workspace tab id instead
    workspaceTabId: '',
    namespace: '',
    metadata: null,
    mockDataGenerator: {
      isModalOpen: false,
      currentStep: MockDataGeneratorStep.AI_DISCLAIMER,
    },
  },
  action
) => {
  if (
    isAction<CollectionMetadataFetchedAction>(
      action,
      CollectionActions.CollectionMetadataFetched
    )
  ) {
    return {
      ...state,
      metadata: action.metadata,
    };
  }

  if (
    isAction<OpenMockDataGeneratorModalAction>(
      action,
      CollectionActions.OpenMockDataGeneratorModal
    )
  ) {
    return {
      ...state,
      mockDataGenerator: {
        ...state.mockDataGenerator,
        isModalOpen: true,
        currentStep: MockDataGeneratorStep.AI_DISCLAIMER,
      },
    };
  }

  if (
    isAction<CloseMockDataGeneratorModalAction>(
      action,
      CollectionActions.CloseMockDataGeneratorModal
    )
  ) {
    return {
      ...state,
      mockDataGenerator: {
        ...state.mockDataGenerator,
        isModalOpen: false,
        currentStep: MockDataGeneratorStep.AI_DISCLAIMER,
      },
    };
  }

  if (
    isAction<SetMockDataGeneratorStepAction>(
      action,
      CollectionActions.SetMockDataGeneratorStep
    )
  ) {
    return {
      ...state,
      mockDataGenerator: {
        ...state.mockDataGenerator,
        currentStep: action.step,
      },
    };
  }

  return state;
};

export const collectionMetadataFetched = (
  metadata: CollectionMetadata
): CollectionMetadataFetchedAction => {
  return { type: CollectionActions.CollectionMetadataFetched, metadata };
};

export const openMockDataGeneratorModal =
  (): OpenMockDataGeneratorModalAction => {
    return { type: CollectionActions.OpenMockDataGeneratorModal };
  };

export const closeMockDataGeneratorModal =
  (): CloseMockDataGeneratorModalAction => {
    return { type: CollectionActions.CloseMockDataGeneratorModal };
  };

export const setMockDataGeneratorStep = (
  step: MockDataGeneratorStep
): SetMockDataGeneratorStepAction => {
  return { type: CollectionActions.SetMockDataGeneratorStep, step };
};

export const selectTab = (
  tabName: CollectionSubtab
): CollectionThunkAction<void> => {
  return (_dispatch, getState, { workspaces }) => {
    workspaces.openCollectionWorkspaceSubtab(
      getState().workspaceTabId,
      tabName
    );
  };
};

export type CollectionTabPluginMetadata = CollectionMetadata & {
  /**
   * Initial query for the query bar
   */
  query?: unknown;
  /**
   * Stored pipeline metadata. Can be provided to preload stored pipeline
   * right when the plugin is initialized
   */
  aggregation?: unknown;
  /**
   * Initial pipeline that will be converted to a string to be used by the
   * aggregation builder. Takes precedence over `pipelineText` option
   */
  pipeline?: unknown[];
  /**
   * Initial pipeline text to be used by the aggregation builder
   */
  pipelineText?: string;
  /**
   * Namespace for the view that is being edited. Needs to be provided with the
   * `pipeline` options
   */
  editViewName?: string;
};

export default reducer;
