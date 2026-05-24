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

export type SchemaFields = Readonly<Record<string, SchemaFieldSubset>>;

export type FieldStoreService = {
  updateFieldsFromDocuments(
    ns: string,
    documents: Record<string, any>[]
  ): Promise<void>;
  updateFieldsFromSchema(ns: string, schema: Schema): void;
  /**
   * Returns the field store's fields record for the given namespace.
   * Used to preserve field types when inserting new documents.
   * Returns undefined if no schema is available.
   */
  getSchemaFieldsForNamespace(ns: string): SchemaFields | undefined;
};

function createFieldStoreService(
  dispatch: ReturnType<typeof useDispatch>,
  getState: () => ConnectionNamespacesState,
  connectionInfoRef: ConnectionInfoRef
): FieldStoreService {
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
    getSchemaFieldsForNamespace(ns: string): SchemaFields | undefined {
      const state = getState();
      return state[connectionInfoRef.current.id]?.[ns]?.fields;
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
