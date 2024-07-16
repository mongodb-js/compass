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
import { css } from '@mongodb-js/compass-components';

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
    header: renderDottedLine,
  };

  return async function fullCompletions(context: CompletionContext) {
    if (context.state.doc.toString() === '{}') {
      return queryHistoryAutocompleter(context);
    }

    const combinedOptions = [];
    // completions assigned to a section appear below ones that are not assigned
    const baseCompletions = await originalQueryAutocompleter(context);
    const historyCompletions = await queryHistoryAutocompleter(context);

    if (baseCompletions) {
      combinedOptions.push(
        ...baseCompletions.options.map((option) => ({
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
        baseCompletions?.from ?? context.pos
      ),
      options: combinedOptions,
    };
  };
};

const sectionHeaderStyles = css({
  display: 'list-item',
  borderBottom: '1px dashed #ccc',
  margin: `5px 0`,
});

function renderDottedLine(): HTMLElement {
  const header = document.createElement('div');
  header.className = sectionHeaderStyles;
  return header;
}
