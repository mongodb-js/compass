import {
  type CompletionSource,
  type CompletionContext,
  type CompletionSection,
  type Completion,
} from '@codemirror/autocomplete';
import { css } from '@mongodb-js/compass-components';
import type { CompletionOptions } from '../autocompleter';
import type { CodemirrorThemeType } from '../editor';
import { createQueryAutocompleter } from './query-autocompleter';
import {
  type SavedQuery,
  createQueryHistoryAutocompleter,
} from './query-history-autocompleter';

export const createQueryWithHistoryAutocompleter = ({
  savedQueries,
  options = {},
  queryProperty,
  onApply,
  theme,
}: {
  savedQueries: SavedQuery[];
  options?: Pick<CompletionOptions, 'fields' | 'serverVersion'>;
  queryProperty: string;
  onApply: (query: SavedQuery['queryProperties']) => void;
  theme: CodemirrorThemeType;
}): CompletionSource => {
  const queryHistoryAutocompleter = createQueryHistoryAutocompleter({
    savedQueries,
    onApply,
    queryProperty,
    theme,
  });

  const originalQueryAutocompleter = createQueryAutocompleter(options);
  const historySection: CompletionSection = {
    name: 'Query History',
    header: renderDottedLine,
  };

  return async function fullCompletions(context: CompletionContext) {
    if (context.state.doc.toString() === '{}') {
      return queryHistoryAutocompleter(context);
    }

    const combinedOptions: Completion[] = [];
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
