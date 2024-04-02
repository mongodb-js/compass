import React, { useMemo } from 'react';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import { createSelectorHook, createDispatchHook } from 'react-redux';
import { changeFields, type ConnectionNamespacesState } from '../modules';
import type { SchemaFieldSubset } from '../modules/fields';
import { schemaFieldsToAutocompleteItems } from '../modules/fields';
import { createServiceLocator } from 'hadron-app-registry';
import type { Schema } from 'mongodb-schema';
import parseSchema from 'mongodb-schema';
import {
  type ConnectionInfoAccess,
  connectionInfoAccessLocator,
  useConnectionInfo,
  useConnectionInfoAccess,
} from '@mongodb-js/connection-storage/provider';

export const FieldStoreContext = React.createContext<
  ReactReduxContextValue<ConnectionNamespacesState>
>(
  // @ts-expect-error react-redux types
  null
);

const useDispatch = createDispatchHook(FieldStoreContext);

const useSelector: TypedUseSelectorHook<ConnectionNamespacesState> =
  createSelectorHook(FieldStoreContext);

export type FieldStoreService = {
  updateFieldsFromDocuments(
    ns: string,
    documents: Record<string, any>[]
  ): Promise<void>;
  updateFieldsFromSchema(ns: string, schema: Schema): void;
};

export function createFieldStoreService(
  dispatch: ReturnType<typeof useDispatch>,
  connectionInfoAccess: ConnectionInfoAccess
): FieldStoreService {
  return {
    async updateFieldsFromDocuments(
      ns: string,
      documents: Record<string, any>[]
    ) {
      try {
        const { fields } = await parseSchema(documents);
        dispatch(
          changeFields(
            connectionInfoAccess.getCurrentConnectionInfo().id,
            ns,
            fields
          )
        );
      } catch (error) {
        // ignore errors
      }
    },
    updateFieldsFromSchema(ns: string, schema: Schema) {
      dispatch(
        changeFields(
          connectionInfoAccess.getCurrentConnectionInfo().id,
          ns,
          schema.fields
        )
      );
    },
  };
}

/**
 * Exporting this only for the purpose of testing the service implementation. We
 * don't expect to use FieldStoreService outside of Redux stores and for that
 * our service locator is supposed to be used.
 */
export const useFieldStoreServiceForTests = () => {
  const dispatch = useDispatch();
  const connectionInfoAccess = useConnectionInfoAccess();
  return createFieldStoreService(dispatch, connectionInfoAccess);
};

export const fieldStoreServiceLocator = createServiceLocator(
  function fieldStoreServiceLocator() {
    const dispatch = useDispatch();
    const connectionInfoAccess = connectionInfoAccessLocator();
    return createFieldStoreService(dispatch, connectionInfoAccess);
  },
  'fieldStoreServiceLocator'
);

const EMPTY_FIELDS_OBJECT = Object.create(null);

export function useFieldsSchema(
  namespace: string
): Readonly<Record<string, SchemaFieldSubset>> {
  const { id: connectionInfoId } = useConnectionInfo();
  let fields: Record<string, SchemaFieldSubset> = EMPTY_FIELDS_OBJECT;
  try {
    fields = useSelector(
      (state) =>
        state[connectionInfoId]?.[namespace]?.fields ?? EMPTY_FIELDS_OBJECT
    );
  } catch (err) {
    // We can only end up with an error here if store is missing in context,
    // this is safe to ignore in test environment
    if (process.env.NODE_ENV !== 'test') {
      throw err;
    }
  }
  return fields;
}

export function useAutocompleteFields(
  namespace: string
): ReturnType<typeof schemaFieldsToAutocompleteItems> {
  const fields = useFieldsSchema(namespace);
  return useMemo(() => {
    return schemaFieldsToAutocompleteItems(fields);
  }, [fields]);
}
