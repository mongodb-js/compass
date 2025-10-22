import type { Reducer, AnyAction, Action } from 'redux';
import { analyzeDocuments } from 'mongodb-schema';
import { UUID } from 'bson';
import { isCancelError } from '@mongodb-js/compass-utils';

import type { CollectionMetadata } from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';
import type { experimentationServiceLocator } from '@mongodb-js/compass-telemetry/provider';
import { type Logger, mongoLogId } from '@mongodb-js/compass-logging/provider';
import { type PreferencesAccess } from 'compass-preferences-model/provider';
import type { MockDataSchemaRequest } from '@mongodb-js/compass-generative-ai';
import { isInternalFieldPath } from 'hadron-document';
import toNS from 'mongodb-ns';
import {
  SCHEMA_ANALYSIS_STATE_ANALYZING,
  SCHEMA_ANALYSIS_STATE_COMPLETE,
  SCHEMA_ANALYSIS_STATE_ERROR,
  SCHEMA_ANALYSIS_STATE_INITIAL,
  type SchemaAnalysisError,
  type SchemaAnalysisState,
  type FieldInfo,
  type MongoDBFieldType,
} from '../schema-analysis-types';
import { calculateSchemaDepth } from '../calculate-schema-depth';
import {
  processSchema,
  ProcessSchemaUnsupportedStateError,
} from '../transform-schema-to-field-info';
import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import type { Document, MongoError } from 'mongodb';
import { MockDataGeneratorStep } from '../components/mock-data-generator-modal/types';
import type {
  LlmFakerMapping,
  FakerSchema,
  MockDataGeneratorState,
} from '../components/mock-data-generator-modal/types';
import { DEFAULT_DOCUMENT_COUNT } from '../components/mock-data-generator-modal/constants';

import { isValidFakerMethod } from '../components/mock-data-generator-modal/utils';

const DEFAULT_SAMPLE_SIZE = 100;

const NO_DOCUMENTS_ERROR = 'No documents found in the collection to analyze.';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;
export const UNRECOGNIZED_FAKER_METHOD = 'Unrecognized';

function getErrorDetails(error: Error): SchemaAnalysisError {
  if (error instanceof ProcessSchemaUnsupportedStateError) {
    return {
      errorType: 'unsupportedState',
      errorMessage: error.message,
    };
  }

  const errorCode = (error as MongoError).code;
  const errorMessage = error.message || 'Unknown error';
  let errorType: SchemaAnalysisError['errorType'] = 'general';
  if (errorCode === ERROR_CODE_MAX_TIME_MS_EXPIRED) {
    errorType = 'timeout';
  } else if (error.message.includes('Schema analysis aborted: Fields count')) {
    errorType = 'highComplexity';
  }

  return {
    errorType,
    errorMessage,
  };
}

type CollectionThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  CollectionState,
  {
    localAppRegistry: AppRegistry;
    dataService: DataService;
    atlasAiService: AtlasAiService;
    workspaces: ReturnType<typeof workspacesServiceLocator>;
    experimentationServices: ReturnType<typeof experimentationServiceLocator>;
    logger: Logger;
    preferences: PreferencesAccess;
    connectionInfoRef: ConnectionInfoRef;
    fakerSchemaGenerationAbortControllerRef: { current?: AbortController };
    schemaAnalysisAbortControllerRef: { current?: AbortController };
    collection: Collection;
  },
  A
>;

export type CollectionState = {
  workspaceTabId: string;
  namespace: string;
  metadata: CollectionMetadata | null;
  editViewName?: string;
  schemaAnalysis: SchemaAnalysisState;
  mockDataGenerator: {
    isModalOpen: boolean;
    currentStep: MockDataGeneratorStep;
    documentCount: number;
  };
  fakerSchemaGeneration: MockDataGeneratorState;
};

export enum CollectionActions {
  CollectionMetadataFetched = 'compass-collection/CollectionMetadataFetched',
  SchemaAnalysisStarted = 'compass-collection/SchemaAnalysisStarted',
  SchemaAnalysisFinished = 'compass-collection/SchemaAnalysisFinished',
  SchemaAnalysisFailed = 'compass-collection/SchemaAnalysisFailed',
  SchemaAnalysisCanceled = 'compass-collection/SchemaAnalysisCanceled',
  SchemaAnalysisReset = 'compass-collection/SchemaAnalysisReset',
  MockDataGeneratorModalOpened = 'compass-collection/MockDataGeneratorModalOpened',
  MockDataGeneratorModalClosed = 'compass-collection/MockDataGeneratorModalClosed',
  MockDataGeneratorNextButtonClicked = 'compass-collection/MockDataGeneratorNextButtonClicked',
  MockDataGeneratorPreviousButtonClicked = 'compass-collection/MockDataGeneratorPreviousButtonClicked',
  MockDataGeneratorDocumentCountChanged = 'compass-collection/MockDataGeneratorDocumentCountChanged',
  FakerMappingGenerationStarted = 'compass-collection/FakerMappingGenerationStarted',
  FakerMappingGenerationCompleted = 'compass-collection/FakerMappingGenerationCompleted',
  FakerMappingGenerationFailed = 'compass-collection/FakerMappingGenerationFailed',
  FakerFieldTypeChanged = 'compass-collection/FakerFieldTypeChanged',
  FakerFieldMethodChanged = 'compass-collection/FakerFieldMethodChanged',
}

interface CollectionMetadataFetchedAction {
  type: CollectionActions.CollectionMetadataFetched;
  metadata: CollectionMetadata;
}

interface SchemaAnalysisResetAction {
  type: CollectionActions.SchemaAnalysisReset;
}

interface SchemaAnalysisStartedAction {
  type: CollectionActions.SchemaAnalysisStarted;
}

interface SchemaAnalysisFinishedAction {
  type: CollectionActions.SchemaAnalysisFinished;
  processedSchema: Record<string, FieldInfo>;
  arrayLengthMap: Record<string, number>;
  sampleDocument: Document;
  schemaMetadata: {
    maxNestingDepth: number;
    validationRules: Document | null;
    avgDocumentSize: number | undefined;
  };
}

interface SchemaAnalysisFailedAction {
  type: CollectionActions.SchemaAnalysisFailed;
  error: Error;
}

interface SchemaAnalysisCanceledAction {
  type: CollectionActions.SchemaAnalysisCanceled;
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

interface MockDataGeneratorDocumentCountChangedAction {
  type: CollectionActions.MockDataGeneratorDocumentCountChanged;
  documentCount: number;
}

export interface FakerMappingGenerationStartedAction {
  type: CollectionActions.FakerMappingGenerationStarted;
  requestId: string;
}

export interface FakerMappingGenerationCompletedAction {
  type: CollectionActions.FakerMappingGenerationCompleted;
  fakerSchema: FakerSchema;
  requestId: string;
}

export interface FakerMappingGenerationFailedAction {
  type: CollectionActions.FakerMappingGenerationFailed;
  error: string;
  requestId: string;
}

export interface FakerFieldTypeChangedAction {
  type: CollectionActions.FakerFieldTypeChanged;
  fieldPath: string;
  mongoType: MongoDBFieldType;
}

export interface FakerFieldMethodChangedAction {
  type: CollectionActions.FakerFieldMethodChanged;
  fieldPath: string;
  fakerMethod: string;
}

const reducer: Reducer<CollectionState, Action> = (
  state = {
    // TODO(COMPASS-7782): use hook to get the workspace tab id instead
    workspaceTabId: '',
    namespace: '',
    metadata: null,
    schemaAnalysis: {
      status: SCHEMA_ANALYSIS_STATE_INITIAL,
    },
    mockDataGenerator: {
      isModalOpen: false,
      currentStep: MockDataGeneratorStep.SCHEMA_CONFIRMATION,
      documentCount: DEFAULT_DOCUMENT_COUNT,
    },
    fakerSchemaGeneration: {
      status: 'idle',
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
    isAction<SchemaAnalysisResetAction>(
      action,
      CollectionActions.SchemaAnalysisReset
    )
  ) {
    return {
      ...state,
      schemaAnalysis: {
        status: SCHEMA_ANALYSIS_STATE_INITIAL,
      },
    };
  }

  if (
    isAction<SchemaAnalysisStartedAction>(
      action,
      CollectionActions.SchemaAnalysisStarted
    )
  ) {
    return {
      ...state,
      schemaAnalysis: {
        status: SCHEMA_ANALYSIS_STATE_ANALYZING,
      },
    };
  }

  if (
    isAction<SchemaAnalysisFinishedAction>(
      action,
      CollectionActions.SchemaAnalysisFinished
    )
  ) {
    return {
      ...state,
      schemaAnalysis: {
        status: SCHEMA_ANALYSIS_STATE_COMPLETE,
        processedSchema: action.processedSchema,
        arrayLengthMap: action.arrayLengthMap,
        sampleDocument: action.sampleDocument,
        schemaMetadata: action.schemaMetadata,
      },
    };
  }

  if (
    isAction<SchemaAnalysisFailedAction>(
      action,
      CollectionActions.SchemaAnalysisFailed
    )
  ) {
    return {
      ...state,
      schemaAnalysis: {
        status: SCHEMA_ANALYSIS_STATE_ERROR,
        error: getErrorDetails(action.error),
      },
    };
  }

  if (
    isAction<SchemaAnalysisCanceledAction>(
      action,
      CollectionActions.SchemaAnalysisCanceled
    )
  ) {
    return {
      ...state,
      schemaAnalysis: {
        status: SCHEMA_ANALYSIS_STATE_INITIAL,
      },
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
        currentStep: MockDataGeneratorStep.SCHEMA_CONFIRMATION,
        documentCount: DEFAULT_DOCUMENT_COUNT,
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
      fakerSchemaGeneration: {
        status: 'idle',
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
        // TODO: Decide with product what we want behavior to be: close modal? Re-open disclaimer modal, if possible?
        previousStep = MockDataGeneratorStep.SCHEMA_CONFIRMATION;
        break;
      case MockDataGeneratorStep.SCHEMA_EDITOR:
        return {
          ...state,
          fakerSchemaGeneration: {
            status: 'idle',
          },
          mockDataGenerator: {
            ...state.mockDataGenerator,
            currentStep: MockDataGeneratorStep.SCHEMA_CONFIRMATION,
          },
        };
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

  if (
    isAction<MockDataGeneratorDocumentCountChangedAction>(
      action,
      CollectionActions.MockDataGeneratorDocumentCountChanged
    )
  ) {
    return {
      ...state,
      mockDataGenerator: {
        ...state.mockDataGenerator,
        documentCount: action.documentCount,
      },
    };
  }

  if (
    isAction<FakerMappingGenerationStartedAction>(
      action,
      CollectionActions.FakerMappingGenerationStarted
    )
  ) {
    if (
      state.mockDataGenerator.currentStep !==
        MockDataGeneratorStep.SCHEMA_CONFIRMATION ||
      state.fakerSchemaGeneration.status === 'in-progress' ||
      state.fakerSchemaGeneration.status === 'completed'
    ) {
      return state;
    }

    return {
      ...state,
      mockDataGenerator: {
        ...state.mockDataGenerator,
        currentStep: MockDataGeneratorStep.SCHEMA_EDITOR,
      },
      fakerSchemaGeneration: {
        status: 'in-progress',
        requestId: action.requestId,
      },
    };
  }

  if (
    isAction<FakerMappingGenerationCompletedAction>(
      action,
      CollectionActions.FakerMappingGenerationCompleted
    )
  ) {
    if (state.fakerSchemaGeneration.status !== 'in-progress') {
      return state;
    }

    return {
      ...state,
      fakerSchemaGeneration: {
        status: 'completed',
        originalLlmResponse: action.fakerSchema,
        editedFakerSchema: action.fakerSchema, // Initially same as LLM response
        requestId: action.requestId,
      },
    };
  }

  if (
    isAction<FakerMappingGenerationFailedAction>(
      action,
      CollectionActions.FakerMappingGenerationFailed
    )
  ) {
    if (state.fakerSchemaGeneration.status !== 'in-progress') {
      return state;
    }

    return {
      ...state,
      fakerSchemaGeneration: {
        status: 'error',
        error: action.error,
        requestId: action.requestId,
      },
      mockDataGenerator: {
        ...state.mockDataGenerator,
        currentStep: MockDataGeneratorStep.SCHEMA_CONFIRMATION,
      },
    };
  }

  if (
    isAction<FakerFieldTypeChangedAction>(
      action,
      CollectionActions.FakerFieldTypeChanged
    )
  ) {
    if (state.fakerSchemaGeneration.status !== 'completed') {
      return state;
    }

    const { fieldPath, mongoType } = action;
    const currentMapping =
      state.fakerSchemaGeneration.editedFakerSchema[fieldPath];

    if (!currentMapping) {
      return state;
    }

    return {
      ...state,
      fakerSchemaGeneration: {
        ...state.fakerSchemaGeneration,
        editedFakerSchema: {
          ...state.fakerSchemaGeneration.editedFakerSchema,
          [fieldPath]: {
            ...currentMapping,
            mongoType,
          },
        },
      },
    };
  }

  if (
    isAction<FakerFieldMethodChangedAction>(
      action,
      CollectionActions.FakerFieldMethodChanged
    )
  ) {
    if (state.fakerSchemaGeneration.status !== 'completed') {
      return state;
    }

    const { fieldPath, fakerMethod } = action;
    const currentMapping =
      state.fakerSchemaGeneration.editedFakerSchema[fieldPath];

    if (!currentMapping) {
      return state;
    }

    return {
      ...state,
      fakerSchemaGeneration: {
        ...state.fakerSchemaGeneration,
        editedFakerSchema: {
          ...state.fakerSchemaGeneration.editedFakerSchema,
          [fieldPath]: {
            ...currentMapping,
            fakerMethod,
          },
        },
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

export const mockDataGeneratorModalClosed = (): CollectionThunkAction<
  void,
  MockDataGeneratorModalClosedAction
> => {
  return (dispatch, _getState, { fakerSchemaGenerationAbortControllerRef }) => {
    fakerSchemaGenerationAbortControllerRef.current?.abort();
    dispatch({ type: CollectionActions.MockDataGeneratorModalClosed });
  };
};

export const mockDataGeneratorNextButtonClicked =
  (): MockDataGeneratorNextButtonClickedAction => {
    return { type: CollectionActions.MockDataGeneratorNextButtonClicked };
  };

export const mockDataGeneratorPreviousButtonClicked = (): CollectionThunkAction<
  void,
  MockDataGeneratorPreviousButtonClickedAction
> => {
  return (dispatch, _getState, { fakerSchemaGenerationAbortControllerRef }) => {
    fakerSchemaGenerationAbortControllerRef.current?.abort();
    dispatch({
      type: CollectionActions.MockDataGeneratorPreviousButtonClicked,
    });
  };
};

export const mockDataGeneratorDocumentCountChanged = (
  documentCount: number
): MockDataGeneratorDocumentCountChangedAction => {
  return {
    type: CollectionActions.MockDataGeneratorDocumentCountChanged,
    documentCount,
  };
};

export const fakerFieldTypeChanged = (
  fieldPath: string,
  mongoType: MongoDBFieldType
): FakerFieldTypeChangedAction => {
  return {
    type: CollectionActions.FakerFieldTypeChanged,
    fieldPath,
    mongoType,
  };
};

export const fakerFieldMethodChanged = (
  fieldPath: string,
  fakerMethod: string
): FakerFieldMethodChangedAction => {
  return {
    type: CollectionActions.FakerFieldMethodChanged,
    fieldPath,
    fakerMethod,
  };
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

export const openMockDataGeneratorModal = (): CollectionThunkAction<
  Promise<void>
> => {
  return async (dispatch, _getState, { atlasAiService, logger }) => {
    try {
      if (process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN !== 'true') {
        await atlasAiService.ensureAiFeatureAccess();
      }
      dispatch(mockDataGeneratorModalOpened());
    } catch (error) {
      // if failed or user canceled we just don't show the modal
      logger.log.error(
        mongoLogId(1_001_000_364),
        'Collections',
        'Failed to ensure AI feature access and open mock data generator modal',
        error
      );
    }
  };
};

export const analyzeCollectionSchema = (): CollectionThunkAction<
  Promise<void>
> => {
  return async (
    dispatch,
    getState,
    {
      dataService,
      preferences,
      logger,
      schemaAnalysisAbortControllerRef,
      collection: collectionModel,
    }
  ) => {
    const { schemaAnalysis, namespace } = getState();
    const analysisStatus = schemaAnalysis.status;
    if (analysisStatus === SCHEMA_ANALYSIS_STATE_ANALYZING) {
      logger.debug(
        'Schema analysis is already in progress, skipping new analysis.'
      );
      return;
    }

    // Create abort controller for this analysis
    const abortController = new AbortController();
    schemaAnalysisAbortControllerRef.current = abortController;

    try {
      logger.debug('Schema analysis started.');

      dispatch({
        type: CollectionActions.SchemaAnalysisStarted,
      });

      // Sample documents
      const samplingOptions = { size: DEFAULT_SAMPLE_SIZE };
      const driverOptions = {
        maxTimeMS: preferences.getPreferences().maxTimeMS,
      };
      const sampleDocuments = await dataService.sample(
        namespace,
        samplingOptions,
        driverOptions,
        {
          fallbackReadPreference: 'secondaryPreferred',
          abortSignal: abortController.signal,
        }
      );

      // Check if analysis was aborted after sampling
      if (abortController.signal.aborted) {
        logger.debug('Schema analysis was aborted during sampling');
        return;
      }
      if (sampleDocuments.length === 0) {
        logger.debug(NO_DOCUMENTS_ERROR);
        dispatch({
          type: CollectionActions.SchemaAnalysisFailed,
          error: new Error(NO_DOCUMENTS_ERROR),
        });
        return;
      }

      // Analyze sampled documents
      const schemaAccessor = await analyzeDocuments(sampleDocuments);

      // Check if analysis was aborted after document analysis
      if (abortController.signal.aborted) {
        logger.debug('Schema analysis was aborted during document analysis');
        return;
      }

      const schema = await schemaAccessor.getInternalSchema();

      // Filter out internal fields from the schema
      schema.fields = schema.fields.filter(
        ({ path }) => !isInternalFieldPath(path[0])
      );

      // Transform schema to structure that will be used by the LLM
      const processSchemaResult = processSchema(schema);

      const maxNestingDepth = await calculateSchemaDepth(schema);
      const { database, collection } = toNS(namespace);
      const collInfo = await dataService.collectionInfo(database, collection);
      const validationRules = collInfo?.validation?.validator ?? null;
      const schemaMetadata = {
        maxNestingDepth,
        validationRules,
        avgDocumentSize: collectionModel.avg_document_size,
      };

      // Final check before dispatching results
      if (abortController.signal.aborted) {
        logger.debug('Schema analysis was aborted before completion');
        return;
      }

      dispatch({
        type: CollectionActions.SchemaAnalysisFinished,
        processedSchema: processSchemaResult.fieldInfo,
        arrayLengthMap: processSchemaResult.arrayLengthMap,
        sampleDocument: sampleDocuments[0],
        schemaMetadata,
      });
    } catch (err: any) {
      // Check if the error is due to cancellation
      if (isCancelError(err) || abortController.signal.aborted) {
        logger.debug('Schema analysis was aborted');
        dispatch({
          type: CollectionActions.SchemaAnalysisCanceled,
        });
        return;
      }

      logger.log.error(
        mongoLogId(1_001_000_363),
        'Collection',
        'Schema analysis failed',
        {
          namespace,
          error: err.message,
        }
      );
      dispatch({
        type: CollectionActions.SchemaAnalysisFailed,
        error: err as Error,
      });
    } finally {
      // Clean up abort controller
      schemaAnalysisAbortControllerRef.current = undefined;
    }
  };
};

export const cancelSchemaAnalysis = (): CollectionThunkAction<void> => {
  return (
    _dispatch,
    _getState,
    { schemaAnalysisAbortControllerRef, logger }
  ) => {
    if (schemaAnalysisAbortControllerRef.current) {
      logger.debug('Canceling schema analysis');
      schemaAnalysisAbortControllerRef.current.abort();
      schemaAnalysisAbortControllerRef.current = undefined;
    }
  };
};

/**
 * Transforms LLM array format to keyed object structure.
 * Moves fieldPath from object property to object key.
 *
 * @param fakerSchema - The faker schema array from LLM response
 * @param inputSchema - The schema definition for the LLM input used to carry over `mongoType` data
 */
function transformFakerSchemaToObject(
  fakerSchema: LlmFakerMapping[],
  inputSchema: Record<string, FieldInfo>
): FakerSchema {
  const result: FakerSchema = {};

  for (const field of fakerSchema) {
    const { fieldPath, ...fieldMapping } = field;
    result[fieldPath] = {
      ...fieldMapping,
      // Note: `validateFakerSchema` already handles fields that are not present in `inputSchema`
      mongoType: inputSchema[fieldPath]?.type,
    };
  }

  return result;
}

/**
 * Validates a given faker schema against an input schema.
 *
 * - Validates the `fakerMethod` for each field, marking it as unrecognized if invalid
 * - Adds any unmapped input schema fields to the result with an unrecognized faker method
 *
 * @param inputSchema - The schema definition for the input, mapping field names to their metadata.
 * @param fakerSchemaArray - The array of faker schema mappings from LLM to validate and map.
 * @param logger - Logger instance used to log warnings for invalid faker methods.
 * @returns A keyed object of validated faker schema mappings, with one-to-one fields with input schema.
 */
const validateFakerSchema = (
  inputSchema: Record<string, FieldInfo>,
  fakerSchemaRaw: FakerSchema,
  logger: Logger
): FakerSchema => {
  const result: FakerSchema = {};

  // Process all input schema fields in a single O(n) pass
  for (const fieldPath of Object.keys(inputSchema)) {
    if (fakerSchemaRaw[fieldPath]) {
      // input schema field exists in faker schema
      const fakerMapping = {
        ...fakerSchemaRaw[fieldPath],
        probability: inputSchema[fieldPath].probability,
      };
      // Validate the faker method
      const { isValid: isValidMethod, fakerArgs } = isValidFakerMethod(
        fakerMapping.fakerMethod,
        fakerMapping.fakerArgs,
        logger
      );
      if (isValidMethod) {
        result[fieldPath] = {
          ...fakerMapping,
          fakerArgs,
        };
      } else {
        logger.log.warn(
          mongoLogId(1_001_000_372),
          'Collection',
          'Invalid faker method',
          { fakerMethod: fakerMapping.fakerMethod }
        );
        result[fieldPath] = {
          mongoType: fakerMapping.mongoType,
          fakerMethod: UNRECOGNIZED_FAKER_METHOD,
          fakerArgs: [],
          probability: fakerMapping.probability,
        };
      }
    } else {
      // Field not mapped by LLM - add default
      result[fieldPath] = {
        mongoType: inputSchema[fieldPath].type,
        fakerMethod: UNRECOGNIZED_FAKER_METHOD,
        fakerArgs: [],
        probability: inputSchema[fieldPath].probability,
      };
    }
  }

  return result;
};

export const generateFakerMappings = (): CollectionThunkAction<
  Promise<void>
> => {
  return async (
    dispatch,
    getState,
    {
      logger,
      atlasAiService,
      preferences,
      connectionInfoRef,
      fakerSchemaGenerationAbortControllerRef,
    }
  ) => {
    const { schemaAnalysis, fakerSchemaGeneration, namespace } = getState();
    if (schemaAnalysis.status !== SCHEMA_ANALYSIS_STATE_COMPLETE) {
      logger.log.warn(
        mongoLogId(1_001_000_305),
        'Collection',
        'Cannot call `generateFakeMappings` unless schema analysis is complete'
      );
      return;
    }

    if (fakerSchemaGeneration.status === 'in-progress') {
      logger.debug(
        'Faker mapping generation is already in progress, skipping new generation.'
      );
      return;
    }

    const requestId = new UUID().toString();

    const includeSampleValues =
      preferences.getPreferences().enableGenAISampleDocumentPassing;

    try {
      logger.debug('Generating faker mappings');

      const { database, collection } = toNS(namespace);

      dispatch({
        type: CollectionActions.FakerMappingGenerationStarted,
        requestId: requestId,
      });

      fakerSchemaGenerationAbortControllerRef.current?.abort();
      fakerSchemaGenerationAbortControllerRef.current = new AbortController();
      const abortSignal =
        fakerSchemaGenerationAbortControllerRef.current.signal;

      const mockDataSchemaRequest: MockDataSchemaRequest = {
        databaseName: database,
        collectionName: collection,
        schema: schemaAnalysis.processedSchema,
        validationRules: schemaAnalysis.schemaMetadata.validationRules,
        includeSampleValues,
        requestId,
        signal: abortSignal,
      };

      const response = await atlasAiService.getMockDataSchema(
        mockDataSchemaRequest,
        connectionInfoRef.current
      );

      // Transform to keyed object structure
      const transformedFakerSchema = transformFakerSchemaToObject(
        response.fields,
        schemaAnalysis.processedSchema
      );

      const validatedFakerSchema = validateFakerSchema(
        schemaAnalysis.processedSchema,
        transformedFakerSchema,
        logger
      );

      fakerSchemaGenerationAbortControllerRef.current = undefined;
      dispatch({
        type: CollectionActions.FakerMappingGenerationCompleted,
        fakerSchema: validatedFakerSchema,
        requestId: requestId,
      });
    } catch (e) {
      if (isCancelError(e)) {
        // abort errors should not produce error logs
        return;
      }

      const errorMessage = e instanceof Error ? e.stack : String(e);

      logger.log.error(
        mongoLogId(1_001_000_312),
        'Collection',
        'Failed to generate faker.js mappings',
        {
          message: errorMessage,
          namespace,
        }
      );
      dispatch({
        type: CollectionActions.FakerMappingGenerationFailed,
        error: 'faker mapping request failed',
        requestId,
      });
    }
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
