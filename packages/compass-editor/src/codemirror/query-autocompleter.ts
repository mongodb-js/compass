import type { CompletionSource } from '@codemirror/autocomplete';
import type { CompletionOptions } from '../autocompleter';
import { completer } from '../autocompleter';
import {
  createAceCompatAutocompleter,
  createCompletionResultForIdPrefix,
} from './ace-compat-autocompleter';
import { completeWordsInString } from './utils';

/**
 * Autocompleter for the document object, only autocompletes field names in the
 * appropriate format (either escaped or not) both for javascript and json modes
 */
export const createQueryAutocompleter = (
  options: Pick<CompletionOptions, 'fields' | 'serverVersion'> = {}
): CompletionSource => {
  const completions = completer('', {
    meta: ['query', 'bson', 'field:identifier'],
    ...options,
  });

  return createAceCompatAutocompleter({
    String({ context }) {
      return completeWordsInString(context);
    },
    IdentifierLike({ prefix }) {
      return createCompletionResultForIdPrefix({ prefix, completions });
    },
  });
};
