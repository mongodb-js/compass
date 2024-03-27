import React, { useMemo } from 'react';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import { createSelectorHook } from 'react-redux';
import type { ConnectionNamespacesState } from '../modules';
import type { SchemaFieldSubset } from '../modules/fields';
import { schemaFieldsToAutocompleteItems } from '../modules/fields';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

export const FieldStoreContext = React.createContext<
  ReactReduxContextValue<ConnectionNamespacesState>
>(
  // @ts-expect-error react-redux types
  null
);

const useSelector: TypedUseSelectorHook<ConnectionNamespacesState> =
  createSelectorHook(FieldStoreContext);

const EMPTY_FIELDS_OBJECT = Object.create(null);

export function useFieldsSchema(
  connectionInfo: ConnectionInfo,
  namespace: string
): Readonly<Record<string, SchemaFieldSubset>> {
  let fields: Record<string, SchemaFieldSubset> = EMPTY_FIELDS_OBJECT;
  try {
    fields = useSelector(
      (state) =>
        state[connectionInfo.id]?.[namespace]?.fields ?? EMPTY_FIELDS_OBJECT
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
  connectionInfo: ConnectionInfo,
  namespace: string
): ReturnType<typeof schemaFieldsToAutocompleteItems> {
  const fields = useFieldsSchema(connectionInfo, namespace);
  return useMemo(() => {
    return schemaFieldsToAutocompleteItems(fields);
  }, [fields]);
}
