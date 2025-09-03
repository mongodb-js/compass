import type { Reducer } from 'redux';
import { isAction } from './util';
import type { DataModelingThunkAction } from './reducer';
import { analyzeDocuments, type MongoDBJSONSchema } from 'mongodb-schema';
import { getCurrentDiagramFromState } from './diagram';
import { UUID } from 'bson';
import type { Relationship } from '../services/data-model-storage';
import { applyLayout } from '@mongodb-js/diagramming';
import { collectionToBaseNodeForLayout } from '../utils/nodes-and-edges';
import { inferForeignToLocalRelationshipsForCollection } from './relationships';

export type AnalysisProcessState = {
  currentAnalysisOptions:
    | ({
        name: string;
        connectionId: string;
        database: string;
        collections: string[];
      } & AnalysisOptions)
    | null;
  samplesFetched: number;
  schemasAnalyzed: number;
  relationsInferred: boolean;
};

export enum AnalysisProcessActionTypes {
  ANALYZING_COLLECTIONS_START = 'data-modeling/analysis-stats/ANALYZING_COLLECTIONS_START',
  NAMESPACE_SAMPLE_FETCHED = 'data-modeling/analysis-stats/NAMESPACE_SAMPLE_FETCHED',
  NAMESPACE_SCHEMA_ANALYZED = 'data-modeling/analysis-stats/NAMESPACE_SCHEMA_ANALYZED',
  NAMESPACES_RELATIONS_INFERRED = 'data-modeling/analysis-stats/NAMESPACES_RELATIONS_INFERRED',
  ANALYSIS_FINISHED = 'data-modeling/analysis-stats/ANALYSIS_FINISHED',
  ANALYSIS_FAILED = 'data-modeling/analysis-stats/ANALYSIS_FAILED',
  ANALYSIS_CANCELED = 'data-modeling/analysis-stats/ANALYSIS_CANCELED',
}

export type AnalysisOptions = {
  automaticallyInferRelations: boolean;
};

export type AnalyzingCollectionsStartAction = {
  type: AnalysisProcessActionTypes.ANALYZING_COLLECTIONS_START;
  name: string;
  connectionId: string;
  database: string;
  collections: string[];
  options: AnalysisOptions;
};

export type NamespaceSampleFetchedAction = {
  type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED;
  namespace: string;
};

export type NamespaceSchemaAnalyzedAction = {
  type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED;
  namespace: string;
};

export type NamespacesRelationsInferredAction = {
  type: AnalysisProcessActionTypes.NAMESPACES_RELATIONS_INFERRED;
  namespace: string;
  count: number;
};

export type AnalysisFinishedAction = {
  type: AnalysisProcessActionTypes.ANALYSIS_FINISHED;
  name: string;
  connectionId: string;
  collections: {
    ns: string;
    schema: MongoDBJSONSchema;
    position: { x: number; y: number };
  }[];
  relations: Relationship[];
};

export type AnalysisFailedAction = {
  type: AnalysisProcessActionTypes.ANALYSIS_FAILED;
  error: Error;
};

export type AnalysisCanceledAction = {
  type: AnalysisProcessActionTypes.ANALYSIS_CANCELED;
};

export type AnalysisProgressActions =
  | AnalyzingCollectionsStartAction
  | NamespaceSampleFetchedAction
  | NamespaceSchemaAnalyzedAction
  | NamespacesRelationsInferredAction
  | AnalysisFinishedAction
  | AnalysisFailedAction
  | AnalysisCanceledAction;

const INITIAL_STATE = {
  currentAnalysisOptions: null,
  samplesFetched: 0,
  schemasAnalyzed: 0,
  relationsInferred: false,
};

export const analysisProcessReducer: Reducer<AnalysisProcessState> = (
  state = INITIAL_STATE,
  action
) => {
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
    };
  }
  if (isAction(action, AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED)) {
    return {
      ...state,
      samplesFetched: state.samplesFetched + 1,
    };
  }
  if (isAction(action, AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED)) {
    return {
      ...state,
      schemasAnalyzed: state.schemasAnalyzed + 1,
    };
  }
  return state;
};

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
  return async (dispatch, getState, services) => {
    const namespaces = collections.map((collName) => {
      return `${database}.${collName}`;
    });
    const cancelController = (services.cancelAnalysisControllerRef.current =
      new AbortController());
    dispatch({
      type: AnalysisProcessActionTypes.ANALYZING_COLLECTIONS_START,
      name,
      connectionId,
      database,
      collections,
      options,
    });
    try {
      let relations: Relationship[] = [];
      const dataService =
        services.connections.getDataServiceForConnection(connectionId);

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

          const accessor = await analyzeDocuments(sample, {
            signal: cancelController.signal,
          });

          // TODO(COMPASS-9314): Update how we show analysis progress.
          dispatch({
            type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
            namespace: ns,
          });

          const schema = await accessor.getMongoDBJsonSchema({
            signal: cancelController.signal,
          });
          dispatch({
            type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
            namespace: ns,
          });
          return { ns, schema, sample };
        })
      );

      if (options.automaticallyInferRelations) {
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
                    dataService
                  );
                dispatch({
                  type: AnalysisProcessActionTypes.NAMESPACES_RELATIONS_INFERRED,
                  namespace: ns,
                  count: relationships.length,
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

      const positioned = await applyLayout(
        collections.map((coll) => {
          return collectionToBaseNodeForLayout({
            ns: coll.ns,
            jsonSchema: coll.schema,
            displayPosition: [0, 0],
          });
        }),
        [],
        'LEFT_RIGHT'
      );

      dispatch({
        type: AnalysisProcessActionTypes.ANALYSIS_FINISHED,
        name,
        connectionId,
        collections: collections.map((coll) => {
          const node = positioned.nodes.find((node) => {
            return node.id === coll.ns;
          });
          const position = node ? node.position : { x: 0, y: 0 };
          return { ...coll, position };
        }),
        relations,
      });

      services.track('Data Modeling Diagram Created', {
        num_collections: collections.length,
      });

      void services.dataModelStorage.save(
        getCurrentDiagramFromState(getState())
      );
    } catch (err) {
      if (cancelController.signal.aborted) {
        dispatch({ type: AnalysisProcessActionTypes.ANALYSIS_CANCELED });
      } else {
        services.logger.log.error(
          services.logger.mongoLogId(1_001_000_350),
          'DataModeling',
          'Failed to analyze schema',
          { err }
        );
        dispatch({
          type: AnalysisProcessActionTypes.ANALYSIS_FAILED,
          error: err as Error,
        });
      }
    } finally {
      services.cancelAnalysisControllerRef.current = null;
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
