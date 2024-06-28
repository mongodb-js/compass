import type {
  CompletionContext,
  CompletionSource,
} from '@codemirror/autocomplete';
import { formatDate, spacing } from '@mongodb-js/compass-components';
import type { RecentQuery } from '@mongodb-js/my-queries-storage';
import { toJSString } from 'mongodb-query-parser';
import { css } from '@mongodb-js/compass-components';

export const createQueryHistoryAutocompleter = (
  recentQueries: RecentQuery[],
  onApply: (query: RecentQuery) => void
): CompletionSource => {
  return function queryCompletions(context: CompletionContext) {
    if (recentQueries.length === 0) {
      return null;
    }

    const queryLabelStyles = css({
      textTransform: 'capitalize',
      fontWeight: 'bold',
      margin: `${spacing[2]}px 0`,
    });

    const queryCodeStyles = css({
      maxHeight: '30vh',
    });

    const properties = [
      'filter',
      'sort',
      'collation',
      'sort',
      'hint',
      'skip',
      'limit',
      'maxTimeMS',
    ];

    function createInfo(query: RecentQuery): {
      dom: Node;
      destroy?: () => void;
    } {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'query-history-query-attribute');
      Object.entries(query).forEach(([key, value]) => {
        if (properties.includes(key)) {
          const formattedQuery = toJSString(value);
          const codeDiv = document.createElement('div');

          const label = document.createElement('label');
          label.setAttribute('data-testid', 'query-history-query-label');
          label.className = queryLabelStyles;
          label.textContent = key;

          const code = document.createElement('pre');
          code.setAttribute('data-testid', 'query-history-query-code');
          code.className = queryCodeStyles;
          if (formattedQuery) code.textContent = formattedQuery;

          codeDiv.append(label);
          codeDiv.appendChild(code);
          container.appendChild(codeDiv);
        }
      });

      return {
        dom: container,
        destroy: () => {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        },
      };
    }

    function createQuery(query: RecentQuery): string {
      let res = '';
      Object.entries(query).forEach(([key, value]) => {
        if (properties.includes(key)) {
          const formattedQuery = toJSString(value);
          const noFilterKey = key === 'filter' ? '' : `${key}: `;
          res += formattedQuery ? `, ${noFilterKey}${formattedQuery}` : '';
        }
      });
      const len = res.length;
      return len <= 100 ? res.slice(2, res.length) : res.slice(2, 100);
    }
    const options = recentQueries.map((query) => ({
      label: createQuery(query),
      type: 'text',
      detail: formatDate(query._lastExecuted.getTime()),
      info: () => createInfo(query).dom,
      apply: () => {
        onApply(query);
      },
      boost: query._lastExecuted.getTime(),
    }));

    return {
      from: context.pos,
      options: options,
    };
  };
};
