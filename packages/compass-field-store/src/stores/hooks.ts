import { useMemo } from 'react';
import { useConnectionInfo } from '@mongodb-js/connection-storage/provider';
import {
  type SchemaFieldSubset,
  schemaFieldsToAutocompleteItems,
} from '../modules/fields';
import { useSelector } from './context';

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
