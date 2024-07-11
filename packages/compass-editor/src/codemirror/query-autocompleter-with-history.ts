import {
  type SavedQuery,
  createQueryHistoryAutocompleter,
} from './query-history-autocompleter';
import { createQueryAutocompleter } from './query-autocompleter';
import type {
  CompletionSource,
  CompletionContext,
  CompletionSection,
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
  const historySection: CompletionSection = {
    name: 'Query History',
    header: renderHorizontalLine,
  };

  return async function fullCompletions(context: CompletionContext) {
    if (context.state.doc.toString() === '{}')
      return queryHistoryAutocompleter(context);

    const combinedOptions = [];
    // completions assigned to a section appear below ones that are not assigned
    const originalCompletions = await originalQueryAutocompleter(context);
    const historyCompletions = await queryHistoryAutocompleter(context);

    if (originalCompletions) {
      combinedOptions.push(
        ...originalCompletions.options.map((option) => ({
          ...option,
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

    return {
      from: Math.min(
        historyCompletions?.from ?? context.pos,
        originalCompletions?.from ?? context.pos
      ),
      options: combinedOptions,
    };
  };
};

function renderHorizontalLine(): HTMLElement {
  const header = document.createElement('div');
  header.style.display = 'list-item';
  header.style.borderBottom = '1px dashed #ccc';
  header.style.margin = '5px 0';
  return header;
}
