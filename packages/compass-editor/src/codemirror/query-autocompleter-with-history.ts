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
  const originalSection = { name: '', rank: 0 };
  const historySection = { name: 'Query History', rank: 1 };

  return async function fullCompletions(context: CompletionContext) {
    const combinedOptions = [];
    const originalCompletions = await originalQueryAutocompleter(context);
    const historyCompletions = await queryHistoryAutocompleter(context);
    if (originalCompletions) {
      combinedOptions.push(
        ...originalCompletions.options.map((option) => ({
          ...option,
          section: originalSection,
        }))
      );
    }
    if (historyCompletions) {
      combinedOptions.push(
        ...historyCompletions.options.map((option) => ({
          ...option,
          section: historySection,
        }))
      );
    }

    const nonSectionOptions = combinedOptions.filter(
      (option) => !option.section
    );
    const sectionOptions = combinedOptions.filter((option) => option.section);
    return {
      from: Math.min(
        historyCompletions?.from ?? context.pos,
        originalCompletions?.from ?? context.pos
      ),
      options: [...nonSectionOptions, ...sectionOptions],
    };
  };
};
