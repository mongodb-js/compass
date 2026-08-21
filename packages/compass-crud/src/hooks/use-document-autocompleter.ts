import { useMemo } from 'react';
import { createDocumentAutocompleter } from '@mongodb-js/compass-editor';
import type { Completer } from '@mongodb-js/compass-editor';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';

/**
 * Autocompletes the collection's field names as document property names. Works
 * for both the EJSON and the shell syntax editors: the completer picks the
 * right property quoting based on the editor's language.
 */
export function useDocumentAutocompleter(namespace: string): Completer {
  const fields = useAutocompleteFields(namespace);

  return useMemo(() => {
    return createDocumentAutocompleter(
      fields.map((field) => {
        return field.name;
      })
    );
  }, [fields]);
}
