import { createQueryHistoryAutocompleter } from './query-history-autocompleter';
import { createQueryAutocompleter } from './query-autocompleter';
import type { RecentQuery } from '@mongodb-js/my-queries-storage';
import type {
  CompletionSource,
  CompletionContext,
} from '@codemirror/autocomplete';
import type { CompletionOptions } from '../autocompleter';

export const createFullQueryAutocompleter = (
  recentQueries: RecentQuery[],
  options: Pick<CompletionOptions, 'fields' | 'serverVersion'> = {},
  onApply: (query: RecentQuery) => void
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
