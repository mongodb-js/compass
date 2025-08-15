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
  MockDataGeneratorModalOpened = 'compass-collection/MockDataGeneratorModalOpened',
  MockDataGeneratorModalClosed = 'compass-collection/MockDataGeneratorModalClosed',
  MockDataGeneratorNextButtonClicked = 'compass-collection/MockDataGeneratorNextButtonClicked',
  MockDataGeneratorPreviousButtonClicked = 'compass-collection/MockDataGeneratorPreviousButtonClicked',
}

interface CollectionMetadataFetchedAction {
  type: CollectionActions.CollectionMetadataFetched;
  metadata: CollectionMetadata;
}

interface MockDataGeneratorModalOpenedAction {
  type: CollectionActions.MockDataGeneratorModalOpened;
}

interface MockDataGeneratorModalClosedAction {
  type: CollectionActions.MockDataGeneratorModalClosed;
}

interface MockDataGeneratorNextButtonClickedAction {
  type: CollectionActions.MockDataGeneratorNextButtonClicked;
}

interface MockDataGeneratorPreviousButtonClickedAction {
  type: CollectionActions.MockDataGeneratorPreviousButtonClicked;
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
    isAction<MockDataGeneratorModalOpenedAction>(
      action,
      CollectionActions.MockDataGeneratorModalOpened
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
    isAction<MockDataGeneratorModalClosedAction>(
      action,
      CollectionActions.MockDataGeneratorModalClosed
    )
  ) {
    return {
      ...state,
      mockDataGenerator: {
        ...state.mockDataGenerator,
        isModalOpen: false,
      },
    };
  }

  if (
    isAction<MockDataGeneratorNextButtonClickedAction>(
      action,
      CollectionActions.MockDataGeneratorNextButtonClicked
    )
  ) {
    const currentStep = state.mockDataGenerator.currentStep;
    let nextStep: MockDataGeneratorStep;

    switch (currentStep) {
      case MockDataGeneratorStep.AI_DISCLAIMER:
        nextStep = MockDataGeneratorStep.SCHEMA_CONFIRMATION;
        break;
      case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
        nextStep = MockDataGeneratorStep.SCHEMA_EDITOR;
        break;
      case MockDataGeneratorStep.SCHEMA_EDITOR:
        nextStep = MockDataGeneratorStep.DOCUMENT_COUNT;
        break;
      case MockDataGeneratorStep.DOCUMENT_COUNT:
        nextStep = MockDataGeneratorStep.PREVIEW_DATA;
        break;
      case MockDataGeneratorStep.PREVIEW_DATA:
        nextStep = MockDataGeneratorStep.GENERATE_DATA;
        break;
      default:
        nextStep = currentStep; // Stay on current step if at end
    }

    return {
      ...state,
      mockDataGenerator: {
        ...state.mockDataGenerator,
        currentStep: nextStep,
      },
    };
  }

  if (
    isAction<MockDataGeneratorPreviousButtonClickedAction>(
      action,
      CollectionActions.MockDataGeneratorPreviousButtonClicked
    )
  ) {
    const currentStep = state.mockDataGenerator.currentStep;
    let previousStep: MockDataGeneratorStep;

    switch (currentStep) {
      case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
        previousStep = MockDataGeneratorStep.AI_DISCLAIMER;
        break;
      case MockDataGeneratorStep.SCHEMA_EDITOR:
        previousStep = MockDataGeneratorStep.SCHEMA_CONFIRMATION;
        break;
      case MockDataGeneratorStep.DOCUMENT_COUNT:
        previousStep = MockDataGeneratorStep.SCHEMA_EDITOR;
        break;
      case MockDataGeneratorStep.PREVIEW_DATA:
        previousStep = MockDataGeneratorStep.DOCUMENT_COUNT;
        break;
      case MockDataGeneratorStep.GENERATE_DATA:
        previousStep = MockDataGeneratorStep.PREVIEW_DATA;
        break;
      default:
        previousStep = currentStep; // Stay on current step if at beginning
    }

    return {
      ...state,
      mockDataGenerator: {
        ...state.mockDataGenerator,
        currentStep: previousStep,
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

export const mockDataGeneratorModalOpened =
  (): MockDataGeneratorModalOpenedAction => {
    return { type: CollectionActions.MockDataGeneratorModalOpened };
  };

export const mockDataGeneratorModalClosed =
  (): MockDataGeneratorModalClosedAction => {
    return { type: CollectionActions.MockDataGeneratorModalClosed };
  };

export const mockDataGeneratorNextButtonClicked =
  (): MockDataGeneratorNextButtonClickedAction => {
    return { type: CollectionActions.MockDataGeneratorNextButtonClicked };
  };

export const mockDataGeneratorPreviousButtonClicked =
  (): MockDataGeneratorPreviousButtonClickedAction => {
    return { type: CollectionActions.MockDataGeneratorPreviousButtonClicked };
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
