import type { Reducer } from 'redux';
import { isAction } from './util';
import type { DataModelingThunkAction } from './reducer';
import { analyzeDocuments, type MongoDBJSONSchema } from 'mongodb-schema';
import {
  applySetModelEdit,
  getCurrentDiagramFromState,
  selectCurrentModel,
} from './diagram';
import { UUID } from 'bson';
import {
  type Relationship,
  type StaticModel,
} from '../services/data-model-storage';
import { applyLayout } from '@mongodb-js/compass-components';
import {
  collectionToBaseNodeForLayout,
  relationshipToDiagramEdge,
} from '../utils/nodes-and-edges';
import { inferForeignToLocalRelationshipsForCollection } from './relationships';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { extractFieldsFromFieldData } from '../utils/schema';
import { isEqual } from 'lodash';

type AnalyzedCollection = {
  ns: string;
  schema: MongoDBJSONSchema;
  position: { x: number; y: number };
};

export type AnalysisStep =
  | 'IDLE'
  | 'SAMPLING'
  | 'ANALYZING_SCHEMA'
  | 'INFERRING_RELATIONSHIPS';

export type AnalysisProcessState = {
  currentAnalysisOptions:
    | ({
        name: string;
        connectionId: string;
        database: string;
        collections: string[];
      } & AnalysisOptions)
    | null;
  step: AnalysisStep;
  samplesFetched: number;
  schemasAnalyzed: number;
  willInferRelations: boolean;
  collectionRelationsInferred: number;
};

export const AnalysisProcessActionTypes = {
  ANALYZING_COLLECTIONS_START:
    'data-modeling/analysis-stats/ANALYZING_COLLECTIONS_START',
  NAMESPACE_SAMPLE_FETCHED:
    'data-modeling/analysis-stats/NAMESPACE_SAMPLE_FETCHED',
  NAMESPACE_SCHEMA_ANALYZED:
    'data-modeling/analysis-stats/NAMESPACE_SCHEMA_ANALYZED',
  NAMESPACE_RELATIONS_INFERRED:
    'data-modeling/analysis-stats/NAMESPACE_RELATIONS_INFERRED',
  ANALYSIS_FINISHED: 'data-modeling/analysis-stats/ANALYSIS_FINISHED',
  ANALYSIS_FAILED: 'data-modeling/analysis-stats/ANALYSIS_FAILED',
  ANALYSIS_CANCELED: 'data-modeling/analysis-stats/ANALYSIS_CANCELED',
  REDO_ANALYSIS_FINISHED: 'data-modeling/analysis-stats/REDO_ANALYSIS_FINISHED',
  REDO_ANALYSIS_FAILED: 'data-modeling/analysis-stats/REDO_ANALYSIS_FAILED',
  REDO_ANALYSIS_CANCELED: 'data-modeling/analysis-stats/REDO_ANALYSIS_CANCELED',
} as const;

export type AnalysisOptions = {
  automaticallyInferRelations: boolean;
};

export type AnalyzingCollectionsStartAction = {
  type: typeof AnalysisProcessActionTypes.ANALYZING_COLLECTIONS_START;
  name: string;
  connectionId: string;
  database: string;
  collections: string[];
  options: AnalysisOptions;
  willInferRelations: boolean;
};

export type NamespaceSampleFetchedAction = {
  type: typeof AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED;
};

export type NamespaceSchemaAnalyzedAction = {
  type: typeof AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED;
};

export type NamespacesRelationsInferredAction = {
  type: typeof AnalysisProcessActionTypes.NAMESPACE_RELATIONS_INFERRED;
};

export type AnalysisFinishedAction = {
  type: typeof AnalysisProcessActionTypes.ANALYSIS_FINISHED;
  name: string;
  connectionId: string;
  database: string;
  collections: AnalyzedCollection[];
  relations: Relationship[];
};

export type AnalysisFailedAction = {
  type: typeof AnalysisProcessActionTypes.ANALYSIS_FAILED;
  error: Error;
};

export type AnalysisCanceledAction = {
  type: typeof AnalysisProcessActionTypes.ANALYSIS_CANCELED;
};

export type RedoAnalysisFinishedAction = {
  type: typeof AnalysisProcessActionTypes.REDO_ANALYSIS_FINISHED;
};

export type RedoAnalysisFailedAction = {
  type: typeof AnalysisProcessActionTypes.REDO_ANALYSIS_FAILED;
  error: Error;
};

export type RedoAnalysisCanceledAction = {
  type: typeof AnalysisProcessActionTypes.REDO_ANALYSIS_CANCELED;
};

export type AnalysisProgressActions =
  | AnalyzingCollectionsStartAction
  | NamespaceSampleFetchedAction
  | NamespaceSchemaAnalyzedAction
  | NamespacesRelationsInferredAction
  | AnalysisFinishedAction
  | AnalysisFailedAction
  | AnalysisCanceledAction
  | RedoAnalysisFinishedAction
  | RedoAnalysisFailedAction
  | RedoAnalysisCanceledAction;

const INITIAL_STATE: AnalysisProcessState = {
  currentAnalysisOptions: null,
  step: 'IDLE',
  samplesFetched: 0,
  schemasAnalyzed: 0,
  willInferRelations: false,
  collectionRelationsInferred: 0,
};

export const analysisProcessReducer: Reducer<AnalysisProcessState> = (
  state = INITIAL_STATE,
  action
) => {
  const totalCollections =
    state.currentAnalysisOptions?.collections.length ?? 0;
  if (
    isAction(action, AnalysisProcessActionTypes.ANALYZING_COLLECTIONS_START)
  ) {
    return {
      ...INITIAL_STATE,
      currentAnalysisOptions: {
        name: action.name,
        connectionId: action.connectionId,
        database: action.database,
        collections: action.collections,
        automaticallyInferRelations: action.options.automaticallyInferRelations,
      },
      step: 'SAMPLING',
      willInferRelations: action.willInferRelations,
    };
  }
  if (isAction(action, AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED)) {
    const samplesFetched = state.samplesFetched + 1;
    const nextStep = 'ANALYZING_SCHEMA';
    return {
      ...state,
      samplesFetched,
      step: samplesFetched === totalCollections ? nextStep : state.step,
    };
  }
  if (isAction(action, AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED)) {
    const schemasAnalyzed = state.schemasAnalyzed + 1;
    const nextStep = state.willInferRelations
      ? 'INFERRING_RELATIONSHIPS'
      : 'IDLE';
    return {
      ...state,
      schemasAnalyzed,
      step: schemasAnalyzed === totalCollections ? nextStep : state.step,
    };
  }
  if (
    isAction(action, AnalysisProcessActionTypes.NAMESPACE_RELATIONS_INFERRED)
  ) {
    const collectionRelationsInferred = state.collectionRelationsInferred + 1;
    const nextStep = 'IDLE';
    return {
      ...state,
      collectionRelationsInferred,
      step:
        collectionRelationsInferred === totalCollections
          ? nextStep
          : state.step,
    };
  }
  if (
    isAction(action, AnalysisProcessActionTypes.ANALYSIS_CANCELED) ||
    isAction(action, AnalysisProcessActionTypes.ANALYSIS_FAILED) ||
    isAction(action, AnalysisProcessActionTypes.ANALYSIS_FINISHED) ||
    isAction(action, AnalysisProcessActionTypes.REDO_ANALYSIS_CANCELED) ||
    isAction(action, AnalysisProcessActionTypes.REDO_ANALYSIS_FAILED) ||
    isAction(action, AnalysisProcessActionTypes.REDO_ANALYSIS_FINISHED)
  ) {
    return {
      ...state,
      step: 'IDLE',
    };
  }
  return state;
};

async function getInitialLayout({
  collections,
  relations,
}: {
  collections: {
    ns: string;
    schema: MongoDBJSONSchema;
  }[];
  relations: Relationship[];
}) {
  const hasRelations = relations.length > 0;
  const nodes = collections.map((coll) => {
    return collectionToBaseNodeForLayout({
      ns: coll.ns,
      fieldData: coll.schema,
      displayPosition: [0, 0],
    });
  });
  return await applyLayout({
    nodes,
    edges: relations.map((rel) => relationshipToDiagramEdge(rel, false)),
    direction: hasRelations ? 'STAR' : 'RECTANGLE',
  });
}

export function startAnalysis(
  name: string,
  connectionId: string,
  database: string,
  selectedCollections: string[],
  options: AnalysisOptions
): DataModelingThunkAction<
  Promise<void>,
  | AnalyzingCollectionsStartAction
  | NamespaceSampleFetchedAction
  | NamespaceSchemaAnalyzedAction
  | NamespacesRelationsInferredAction
  | AnalysisFinishedAction
  | AnalysisCanceledAction
  | AnalysisFailedAction
> {
  return async (
    dispatch,
    getState,
    {
      cancelAnalysisControllerRef,
      track,
      logger,
      preferences,
      dataModelStorage,
    }
  ) => {
    // Analysis is in progress, don't start a new one unless user canceled it
    if (cancelAnalysisControllerRef.current) {
      return;
    }

    const willInferRelations =
      preferences.getPreferences().enableAutomaticRelationshipInference &&
      options.automaticallyInferRelations;

    track('Data Modeling Diagram Creation Started', {
      num_collections: selectedCollections.length,
      automatically_infer_relations: willInferRelations,
    });

    const cancelController = (cancelAnalysisControllerRef.current =
      new AbortController());

    const analysisStartTime = Date.now();

    try {
      const { collections, relations } = await dispatch(
        analyzeCollections({
          name,
          connectionId,
          database,
          selectedCollections,
          options,
        })
      );

      const positioned = await getInitialLayout({
        collections,
        relations,
      });

      dispatch({
        type: AnalysisProcessActionTypes.ANALYSIS_FINISHED,
        name,
        connectionId,
        database,
        relations,
        collections: collections.map((coll) => {
          const node = positioned.nodes.find((node) => {
            return node.id === coll.ns;
          });
          const position = node ? node.position : { x: 0, y: 0 };
          return { ...coll, position };
        }),
      });

      track('Data Modeling Diagram Created', {
        num_collections: selectedCollections.length,
        num_relations_inferred: willInferRelations
          ? relations.length
          : undefined,
        analysis_time_ms: Date.now() - analysisStartTime,
      });
      void dataModelStorage.save(getCurrentDiagramFromState(getState()));
    } catch (err) {
      const analysis_time_ms = Date.now() - analysisStartTime;
      if (cancelController.signal.aborted) {
        dispatch({
          type: AnalysisProcessActionTypes.ANALYSIS_CANCELED,
        });
        track('Data Modeling Diagram Creation Cancelled', {
          num_collections: selectedCollections.length,
          analysis_time_ms,
        });
      } else {
        logger.log.error(
          mongoLogId(1_001_000_350),
          'DataModeling',
          'Failed to analyze schema',
          { err }
        );
        dispatch({
          type: AnalysisProcessActionTypes.ANALYSIS_FAILED,
          error: err as Error,
        });
        track('Data Modeling Diagram Creation Failed', {
          num_collections: selectedCollections.length,
          analysis_time_ms,
        });
      }
    } finally {
      cancelAnalysisControllerRef.current = null;
    }
  };
}

export function retryAnalysis(): DataModelingThunkAction<void, never> {
  return (dispatch, getState) => {
    const { currentAnalysisOptions } = getState().analysisProgress;
    if (!currentAnalysisOptions) {
      return null;
    }
    const {
      name,
      connectionId,
      database,
      collections,
      automaticallyInferRelations,
    } = currentAnalysisOptions;
    void dispatch(
      startAnalysis(name, connectionId, database, collections, {
        automaticallyInferRelations,
      })
    );
  };
}

export function cancelAnalysis(): DataModelingThunkAction<void, never> {
  return (_dispatch, _getState, { cancelAnalysisControllerRef }) => {
    cancelAnalysisControllerRef.current?.abort();
    cancelAnalysisControllerRef.current = null;
  };
}

export const selectIsAnalysisInProgress = (state: {
  analysisProgress: AnalysisProcessState;
}): boolean => state.analysisProgress.step !== 'IDLE';

export function redoAnalysis(
  name: string,
  connectionId: string,
  database: string,
  selectedCollections: string[],
  options: AnalysisOptions
): DataModelingThunkAction<
  Promise<void>,
  | AnalyzingCollectionsStartAction
  | NamespaceSampleFetchedAction
  | NamespaceSchemaAnalyzedAction
  | NamespacesRelationsInferredAction
  | RedoAnalysisFinishedAction
  | RedoAnalysisCanceledAction
  | RedoAnalysisFailedAction
> {
  return async (
    dispatch,
    getState,
    { cancelAnalysisControllerRef, logger }
  ) => {
    // Analysis is in progress, don't start a new one unless user canceled it
    if (cancelAnalysisControllerRef.current) {
      return;
    }
    const diagram = getCurrentDiagramFromState(getState());
    const cancelController = (cancelAnalysisControllerRef.current =
      new AbortController());
    try {
      // If we don't want to infer relationship, then let's cut the existing collections
      // from the selected collections list to avoid re-analyzing them for schema.
      const currentModel = selectCurrentModel(diagram.edits);
      const currentCollections = new Set(
        currentModel.collections.map((c) => c.ns)
      );
      const collectionsToBeInferred = options.automaticallyInferRelations
        ? selectedCollections
        : selectedCollections.filter((c) => !currentCollections.has(c));
      const { collections, relations } = await dispatch(
        analyzeCollections({
          name,
          connectionId,
          database,
          selectedCollections: collectionsToBeInferred,
          options,
        })
      );
      const model = await getModelFromReanalysis(
        currentModel,
        collections,
        relations
      );
      void dispatch(applySetModelEdit(model));
      dispatch({
        type: AnalysisProcessActionTypes.REDO_ANALYSIS_FINISHED,
      });
    } catch (err) {
      if (cancelController.signal.aborted) {
        dispatch({ type: AnalysisProcessActionTypes.REDO_ANALYSIS_CANCELED });
      } else {
        logger.log.error(
          mongoLogId(1_001_000_388),
          'DataModeling',
          'Failed to re-analyze schema',
          { err }
        );
        dispatch({
          type: AnalysisProcessActionTypes.REDO_ANALYSIS_FAILED,
          error: err as Error,
        });
      }
    } finally {
      cancelAnalysisControllerRef.current = null;
    }
  };
}

export function analyzeCollections({
  name,
  connectionId,
  database,
  selectedCollections,
  options,
}: {
  name: string;
  connectionId: string;
  database: string;
  selectedCollections: string[];
  options: AnalysisOptions;
}): DataModelingThunkAction<
  Promise<{
    collections: Omit<AnalyzedCollection, 'position'>[];
    relations: Relationship[];
  }>,
  | AnalyzingCollectionsStartAction
  | NamespaceSampleFetchedAction
  | NamespaceSchemaAnalyzedAction
  | NamespacesRelationsInferredAction
  | AnalysisFinishedAction
  | AnalysisCanceledAction
  | AnalysisFailedAction
> {
  return async (
    dispatch,
    _getState,
    { connections, logger, preferences, cancelAnalysisControllerRef, track }
  ) => {
    const abortSignal = cancelAnalysisControllerRef.current?.signal;
    const namespaces = selectedCollections.map((collName) => {
      return `${database}.${collName}`;
    });
    const willInferRelations =
      preferences.getPreferences().enableAutomaticRelationshipInference &&
      options.automaticallyInferRelations;
    dispatch({
      type: AnalysisProcessActionTypes.ANALYZING_COLLECTIONS_START,
      name,
      connectionId,
      database,
      collections: selectedCollections,
      options,
      willInferRelations,
    });
    let relations: Relationship[] = [];
    const dataService = connections.getDataServiceForConnection(connectionId);

    const collections = await Promise.all(
      namespaces.map(async (ns) => {
        const sample = await dataService.sample(
          ns,
          { size: 100 },
          { promoteValues: false },
          {
            abortSignal,
            fallbackReadPreference: 'secondaryPreferred',
          }
        );

        dispatch({
          type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
        });

        const accessor = await analyzeDocuments(sample, {
          signal: abortSignal,
        });

        const schema = await accessor.getMongoDBJsonSchema({
          signal: abortSignal,
        });

        dispatch({
          type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
        });

        return { ns, schema, sample };
      })
    );

    if (willInferRelations) {
      track('Data Modeling Diagram Creation Relationship Inferral Started', {
        num_collections: selectedCollections.length,
      });
      relations = (
        await Promise.all(
          collections.map(
            async ({
              ns,
              schema,
              sample,
            }): Promise<Relationship['relationship'][]> => {
              const relationships =
                await inferForeignToLocalRelationshipsForCollection(
                  ns,
                  schema,
                  sample,
                  collections,
                  dataService,
                  abortSignal,
                  (err) => {
                    logger.log.warn(
                      mongoLogId(1_001_000_371),
                      'DataModeling',
                      'Failed to identify relationship for collection',
                      { ns, error: err.message }
                    );
                  }
                );
              dispatch({
                type: AnalysisProcessActionTypes.NAMESPACE_RELATIONS_INFERRED,
              });
              return relationships;
            }
          )
        )
      ).flatMap((relationships) => {
        return relationships.map((relationship) => {
          return {
            id: new UUID().toHexString(),
            relationship,
            isInferred: true,
          };
        });
      });
    }

    if (abortSignal?.aborted) {
      throw abortSignal.reason;
    }

    return { collections, relations };
  };
}

// Exported for tests only
export async function getModelFromReanalysis(
  currentModel: StaticModel,
  analyzedCollections: Omit<AnalyzedCollection, 'position'>[],
  inferredRelations: Relationship[]
) {
  const initialCollectionsSet = new Set(
    currentModel.collections.map((c) => c.ns)
  );

  const newCollections = analyzedCollections
    .filter((collection) => !initialCollectionsSet.has(collection.ns))
    .map((collection) => ({
      ns: collection.ns,
      fieldData: collection.schema,
      indexes: [],
      shardKey: undefined,
    }));
  // We will reposition in the next step, so lets ignore displayPosition
  const existingCollections = currentModel.collections.map(
    ({ displayPosition, ...coll }) => coll
  );

  const allCollections = [...existingCollections, ...newCollections];

  const positioned = await getInitialLayout({
    collections: allCollections.map((x) => ({
      ns: x.ns,
      schema: x.fieldData,
    })),
    relations: inferredRelations,
  });

  // Only consider the relations that involve at least one newly added collection
  // and if it relates to an existing collection, we want to make sure the fields
  // in the relationship still exist in the existing collection's schema
  const existingCollectionsFieldMap = new Map(
    Array.from(
      existingCollections.map((coll) => [
        coll.ns,
        extractFieldsFromFieldData(coll.fieldData),
      ])
    )
  );
  const newRelations = inferredRelations.filter((relation) => {
    const [local, foreign] = relation.relationship;

    const isLocalCollectionNew = !existingCollectionsFieldMap.has(local.ns!);
    const isForeignCollectionNew = !existingCollectionsFieldMap.has(
      foreign.ns!
    );

    // Must involve at least one newly added collection
    const hasNewCollection = isLocalCollectionNew || isForeignCollectionNew;

    // If its an existing collection, verify its fields exist in the schema
    const isLocalFieldsValid =
      isLocalCollectionNew ||
      (existingCollectionsFieldMap
        .get(local.ns!)
        ?.some((fieldPath) => isEqual(fieldPath, local.fields)) ??
        false);

    const isForeignFieldsValid =
      isForeignCollectionNew ||
      (existingCollectionsFieldMap
        .get(foreign.ns!)
        ?.some((fieldPath) => isEqual(fieldPath, foreign.fields)) ??
        false);

    return hasNewCollection && isLocalFieldsValid && isForeignFieldsValid;
  });
  const existingRelations = currentModel.relationships;
  return {
    collections: allCollections.map((coll) => {
      const node = positioned.nodes.find((node) => {
        return node.id === coll.ns;
      });
      const position = node ? node.position : { x: 0, y: 0 };
      return {
        ...coll,
        displayPosition: [position.x, position.y] as [number, number],
      };
    }),
    relationships: [...existingRelations, ...newRelations],
  };
}
