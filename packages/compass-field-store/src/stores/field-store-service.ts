import { type Schema } from 'mongodb-schema';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  useConnectionInfoRef,
  type ConnectionInfoRef,
} from '@mongodb-js/compass-connections/provider';
import { useDispatch, useStore } from './context';
import { documentsUpdated, schemaUpdated } from '../modules';
import type { ConnectionNamespacesState } from '../modules';
import type { SchemaFieldSubset } from '../modules/fields';

export type FieldStoreService = {
  updateFieldsFromDocuments(
    ns: string,
    documents: Record<string, any>[]
  ): Promise<void>;
  updateFieldsFromSchema(ns: string, schema: Schema): void;
  /**
   * Returns a map of dotted field paths to their observed schema type(s)
   * for the given namespace. Used to preserve field types when inserting
   * new documents. Returns an empty object if no schema is available.
   */
  getSchemaTypesForNamespace(
    ns: string
  ): Readonly<Record<string, string | string[]>>;
};

const EMPTY_SCHEMA_TYPES: Readonly<Record<string, string | string[]>> =
  Object.freeze(Object.create(null));

type SchemaTypesCache = {
  fields: Record<string, SchemaFieldSubset> | undefined;
  types: Readonly<Record<string, string | string[]>>;
};

/**
 * Builds a flattened map of field paths to their schema type(s) from the
 * field store's fields record. The result is cached by reference equality
 * on the fields object — since Redux state is immutable, the same fields
 * reference means the schema hasn't changed and we can skip re-building.
 */
function buildSchemaTypesMap(
  fields: Record<string, SchemaFieldSubset> | undefined,
  cache: SchemaTypesCache
): Readonly<Record<string, string | string[]>> {
  if (!fields) {
    return EMPTY_SCHEMA_TYPES;
  }
  if (fields === cache.fields) {
    return cache.types;
  }
  const types: Record<string, string | string[]> = Object.create(null);
  for (const [path, field] of Object.entries(fields)) {
    types[path] = field.type;
  }
  cache.fields = fields;
  cache.types = types;
  return types;
}

function createFieldStoreService(
  dispatch: ReturnType<typeof useDispatch>,
  getState: () => ConnectionNamespacesState,
  connectionInfoRef: ConnectionInfoRef
): FieldStoreService {
  const schemaTypesCache: SchemaTypesCache = {
    fields: undefined,
    types: EMPTY_SCHEMA_TYPES,
  };

  return {
    async updateFieldsFromDocuments(
      ns: string,
      documents: Record<string, any>[]
    ) {
      await dispatch(
        documentsUpdated(connectionInfoRef.current.id, ns, documents)
      );
    },
    updateFieldsFromSchema(ns: string, schema: Schema) {
      dispatch(schemaUpdated(connectionInfoRef.current.id, ns, schema));
    },
    getSchemaTypesForNamespace(
      ns: string
    ): Readonly<Record<string, string | string[]>> {
      const state = getState();
      const fields = state[connectionInfoRef.current.id]?.[ns]?.fields;
      return buildSchemaTypesMap(fields, schemaTypesCache);
    },
  };
}

/**
 * @internal exported for test purposes only
 */
export function useFieldStoreService(): FieldStoreService {
  const dispatch = useDispatch();
  const store = useStore();
  const connectionInfoRef = useConnectionInfoRef();
  return createFieldStoreService(
    dispatch,
    store.getState.bind(store),
    connectionInfoRef
  );
}

export const fieldStoreServiceLocator: () => FieldStoreService =
  createServiceLocator(useFieldStoreService, 'fieldStoreServiceLocator');
