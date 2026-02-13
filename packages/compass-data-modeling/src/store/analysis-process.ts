import type { Reducer } from 'redux';
import { isAction } from './util';
import type { DataModelingThunkAction } from './reducer';
import type { MongoDBJSONSchema } from 'mongodb-schema';
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
import type { WasmDataService } from '../services/compass-data-service-adapter';
import { CompassDataServiceAdapter } from '../services/compass-data-service-adapter';

// WASM module lazy initialization
// The bundler target's entry file handles WASM setup automatically
// when webpack's asyncWebAssembly experiment is enabled.
// Using dynamic import to load the module asynchronously.
type WasmBuilderOptionsInstance = {
  setIncludeList: (namespaces: string[]) => void;
  setExcludeList: (namespaces: string[]) => void;
  setDryRun: (dryRun: boolean) => void;
  setSchemaCollection: (schemaCollection: string) => void;
  free: () => void;
};

type WasmModule = {
  buildSchema: (
    dataService: WasmDataService,
    options: WasmBuilderOptionsInstance
  ) => Promise<WasmSchemaResult[]>;
  WasmBuilderOptions: new () => WasmBuilderOptionsInstance;
};

let wasmModulePromise: Promise<WasmModule> | null = null;

function getWasmModule(): Promise<WasmModule> {
  if (!wasmModulePromise) {
    // Dynamic import - webpack will handle the WASM loading chain
    wasmModulePromise = import(
      'schema-builder-library'
    ) as unknown as Promise<WasmModule>;
  }
  return wasmModulePromise;
}

/**
 * Type representing the serialized SchemaResult from the WASM module.
 * The Rust enum SchemaResult serializes with the variant name as a key.
 */
export type WasmSchemaResult =
  | { NamespaceOnly: WasmNamespaceInfo }
  | { InitialSchema: WasmNamespaceInfoWithSchema }
  | { FullSchema: WasmNamespaceInfoWithSchema };

type WasmNamespaceInfo = {
  db_name: string;
  coll_or_view_name: string;
  namespace_type: 'Collection' | 'View';
};

type WasmNamespaceInfoWithSchema = {
  namespace_info: WasmNamespaceInfo;
  namespace_schema: MongoDBJSONSchema;
};

/**
 * Options for building schemas.
 */
export interface SchemaBuilderOptions {
  /** Data service for accessing MongoDB */
  dataService: WasmDataService;
  /** List of namespaces to include (format: "database.collection") */
  includeList: string[];
}

/**
 * Service interface for schema building.
 * This allows the WASM-based schema builder to be mocked in tests.
 */
export interface SchemaBuilderService {
  /**
   * Build schemas for the given namespaces.
   * @param options - Schema builder options
   * @returns Array of schema results
   */
  buildSchemas(options: SchemaBuilderOptions): Promise<WasmSchemaResult[]>;
}

/**
 * Default schema builder service using the WASM module.
 */
export const defaultSchemaBuilderService: SchemaBuilderService = {
  async buildSchemas(
    options: SchemaBuilderOptions
  ): Promise<WasmSchemaResult[]> {
    try {
      const wasmModule = await getWasmModule();
      const { buildSchema, WasmBuilderOptions } = wasmModule;

      const wasmOptions = new WasmBuilderOptions();
      wasmOptions.setIncludeList(options.includeList);

      return await buildSchema(options.dataService, wasmOptions);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load WASM module', err);
      return [];
    }
  },
};

/**
 * Mock schema builder service for testing.
 * Returns empty schemas for all requested collections.
 */
export const mockSchemaBuilderService: SchemaBuilderService = {
  buildSchemas(options: SchemaBuilderOptions): Promise<WasmSchemaResult[]> {
    // Return FullSchema results with empty schemas for each namespace
    return Promise.resolve(
      options.includeList.map((ns) => {
        const [database, ...collParts] = ns.split('.');
        const collection = collParts.join('.');
        return {
          FullSchema: {
            namespace_info: {
              db_name: database,
              coll_or_view_name: collection,
              namespace_type: 'Collection' as const,
            },
            namespace_schema: {
              bsonType: 'object' as const,
              properties: {},
            },
          },
        };
      })
    );
  },
};

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

/**
 * Extract schema from a WASM SchemaResult.
 * Returns the namespace info and schema if it's a FullSchema or InitialSchema variant.
 */
function extractSchemaFromResult(
  result: WasmSchemaResult
): WasmNamespaceInfoWithSchema | null {
  if ('FullSchema' in result) {
    return result.FullSchema;
  }
  if ('InitialSchema' in result) {
    return result.InitialSchema;
  }
  return null;
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
    {
      connections,
      logger,
      preferences,
      cancelAnalysisControllerRef,
      track,
      schemaBuilder,
    }
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

    // Step 1: Build schemas using the schema builder service
    const adapter = new CompassDataServiceAdapter(dataService, abortSignal);
    const schemaResults: WasmSchemaResult[] = await schemaBuilder.buildSchemas({
      dataService: adapter,
      includeList: selectedCollections.map((coll) => `${database}.${coll}`),
    });
    console.log(
      'Schema results from WASM:',
      schemaResults?.length,
      schemaResults
    );

    // Create a map of namespace -> schema for quick lookup
    const schemaMap = new Map<string, MongoDBJSONSchema>();
    for (const result of schemaResults) {
      const schemaInfo = extractSchemaFromResult(result);
      if (schemaInfo) {
        const ns = `${schemaInfo.namespace_info.db_name}.${schemaInfo.namespace_info.coll_or_view_name}`;
        schemaMap.set(ns, schemaInfo.namespace_schema);
      }
      console.log('Schema INFO from WASM', { result, schemaInfo });
    }

    // Step 2: Build collections array from schemas
    const collections = namespaces.map((ns) => {
      const schema = schemaMap.get(ns);
      if (!schema) {
        // If no schema was returned, use an empty object schema
        logger.log.warn(
          mongoLogId(1_001_000_389),
          'DataModeling',
          'No schema returned for collection',
          { ns }
        );
      }

      dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
      });

      return {
        ns,
        schema: schema ?? { bsonType: 'object', properties: {} },
      };
    });

    // Step 3: If inferring relations, fetch samples and infer relationships
    if (willInferRelations) {
      // Fetch samples for each collection (needed for relationship inference)
      const samples = await Promise.all(
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

          return { ns, sample };
        })
      );

      // Combine schemas with samples for relationship inference
      const collectionsWithSamples = collections.map((coll) => {
        const sampleData = samples.find((s) => s.ns === coll.ns);
        return {
          ...coll,
          sample: sampleData?.sample ?? [],
        };
      });

      track('Data Modeling Diagram Creation Relationship Inferral Started', {
        num_collections: selectedCollections.length,
      });
      relations = (
        await Promise.all(
          collectionsWithSamples.map(
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
                  collectionsWithSamples,
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
