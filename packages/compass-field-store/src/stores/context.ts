import React, { useMemo } from 'react';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import { createSelectorHook } from 'react-redux';
import type { FieldsState } from '../modules';
import type { SchemaFieldSubset } from '../modules/fields';
import { schemaFieldsToAutocompleteItems } from '../modules/fields';

export const FieldStoreContext = React.createContext<
  ReactReduxContextValue<FieldsState>
>(
  // @ts-expect-error react-redux types
  null
);

const useSelector: TypedUseSelectorHook<FieldsState> =
  createSelectorHook(FieldStoreContext);

const EMPTY_FIELDS_OBJECT = Object.create(null);

export function useFieldsSchema(
  namespace: string
): Readonly<Record<string, SchemaFieldSubset>> {
  let fields: Record<string, SchemaFieldSubset> = EMPTY_FIELDS_OBJECT;
  try {
    fields = useSelector(
      (state) => state[namespace]?.fields ?? EMPTY_FIELDS_OBJECT
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
