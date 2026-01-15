import type { Reducer } from 'redux';
import { isAction } from './util';
import type { DataModelingThunkAction } from './reducer';
import { analyzeDocuments, type MongoDBJSONSchema } from 'mongodb-schema';
import { getCurrentDiagramFromState } from './diagram';
import { UUID } from 'bson';
import {
  DEFAULT_IS_EXPANDED,
  type Relationship,
} from '../services/data-model-storage';
import { applyLayout } from '@mongodb-js/compass-components';
import {
  collectionToBaseNodeForLayout,
  relationshipToDiagramEdge,
} from '../utils/nodes-and-edges';
import { inferForeignToLocalRelationshipsForCollection } from './relationships';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';

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
  collections: {
    ns: string;
    schema: MongoDBJSONSchema;
    position: { x: number; y: number };
    isExpanded: boolean;
  }[];
  relations: Relationship[];
};

export type AnalysisFailedAction = {
  type: typeof AnalysisProcessActionTypes.ANALYSIS_FAILED;
  error: Error;
};

export type AnalysisCanceledAction = {
  type: typeof AnalysisProcessActionTypes.ANALYSIS_CANCELED;
};

export type AnalysisProgressActions =
  | AnalyzingCollectionsStartAction
  | NamespaceSampleFetchedAction
  | NamespaceSchemaAnalyzedAction
  | NamespacesRelationsInferredAction
  | AnalysisFinishedAction
  | AnalysisFailedAction
  | AnalysisCanceledAction;

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
    isAction(action, AnalysisProcessActionTypes.ANALYSIS_FINISHED)
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
  collections: { ns: string; schema: MongoDBJSONSchema; isExpanded: boolean }[];
  relations: Relationship[];
}) {
  const hasRelations = relations.length > 0;
  const nodes = collections.map((coll) => {
    return collectionToBaseNodeForLayout({
      ns: coll.ns,
      jsonSchema: coll.schema,
      displayPosition: [0, 0],
      isExpanded: coll.isExpanded,
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
  collections: string[],
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
      connections,
      cancelAnalysisControllerRef,
      logger,
      track,
      dataModelStorage,
      preferences,
    }
  ) => {
    // Analysis is in progress, don't start a new one unless user canceled it
    if (cancelAnalysisControllerRef.current) {
      return;
    }
    const namespaces = collections.map((collName) => {
      return `${database}.${collName}`;
    });
    const cancelController = (cancelAnalysisControllerRef.current =
      new AbortController());
    const willInferRelations =
      preferences.getPreferences().enableAutomaticRelationshipInference &&
      options.automaticallyInferRelations;

    const analysisStartTime = Date.now();

    dispatch({
      type: AnalysisProcessActionTypes.ANALYZING_COLLECTIONS_START,
      name,
      connectionId,
      database,
      collections,
      options,
      willInferRelations,
    });
    try {
      let relations: Relationship[] = [];
      const dataService = connections.getDataServiceForConnection(connectionId);

      const collections = await Promise.all(
        namespaces.map(async (ns) => {
          const sample = await dataService.sample(
            ns,
            { size: 100 },
            { promoteValues: false },
            {
              abortSignal: cancelController.signal,
              fallbackReadPreference: 'secondaryPreferred',
            }
          );

          dispatch({
            type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
          });

          const accessor = await analyzeDocuments(sample, {
            signal: cancelController.signal,
          });

          const schema = await accessor.getMongoDBJsonSchema({
            signal: cancelController.signal,
          });

          dispatch({
            type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
          });

          return { ns, schema, sample, isExpanded: DEFAULT_IS_EXPANDED };
        })
      );

      if (willInferRelations) {
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
                    cancelController.signal,
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

      if (cancelController.signal.aborted) {
        throw cancelController.signal.reason;
      }

      const positioned = await getInitialLayout({
        collections,
        relations,
      });

      dispatch({
        type: AnalysisProcessActionTypes.ANALYSIS_FINISHED,
        name,
        connectionId,
        database,
        collections: collections.map((coll) => {
          const node = positioned.nodes.find((node) => {
            return node.id === coll.ns;
          });
          const position = node ? node.position : { x: 0, y: 0 };
          return { ...coll, position };
        }),
        relations,
      });

      track('Data Modeling Diagram Created', {
        num_collections: collections.length,
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
          analysis_time_ms,
        });
        track('Data Modeling Diagram Creation Cancelled', {
          num_collections: collections.length,
          analysis_time_ms: Date.now() - analysisStartTime,
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
          analysis_time_ms,
        });
        track('Data Modeling Diagram Creation Failed', {
          num_collections: collections.length,
          analysis_time_ms: Date.now() - analysisStartTime,
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
