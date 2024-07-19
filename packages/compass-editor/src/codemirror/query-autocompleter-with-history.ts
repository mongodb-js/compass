import {
  type SavedQuery,
  createQueryHistoryAutocompleter,
} from './query-history-autocompleter';
import { createQueryAutocompleter } from './query-autocompleter';

import type {
  CompletionSource,
  CompletionContext,
} from '@codemirror/autocomplete';
import type { CompletionOptions } from '../autocompleter';

export const createQueryWithHistoryAutocompleter = (
  recentQueries: SavedQuery[],
  options: Pick<CompletionOptions, 'fields' | 'serverVersion'> = {},
  onApply: (query: SavedQuery['queryProperties']) => void
): CompletionSource => {
  const queryHistoryAutocompleter = createQueryHistoryAutocompleter(
    recentQueries,
    onApply
  );

  const originalQueryAutocompleter = createQueryAutocompleter(options);

  return function fullCompletions(context: CompletionContext) {
    if (context.state.doc.toString() !== '{}')
      return originalQueryAutocompleter(context);
    return queryHistoryAutocompleter(context);
  };
};
