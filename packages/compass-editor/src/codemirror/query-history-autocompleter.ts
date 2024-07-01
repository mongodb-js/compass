import type {
  CompletionContext,
  CompletionSource,
} from '@codemirror/autocomplete';
import { formatDate, spacing } from '@mongodb-js/compass-components';
import { toJSString } from 'mongodb-query-parser';
import { css } from '@mongodb-js/compass-components';

export type SavedQuery = {
  lastExecuted: Date;
  queryProperties: {
    [properyName: string]: any;
  };
};

export const createQueryHistoryAutocompleter = (
  savedQueries: SavedQuery[],
  onApply: (query: SavedQuery['queryProperties']) => void
): CompletionSource => {
  return function queryCompletions(context: CompletionContext) {
    if (savedQueries.length === 0) {
      return null;
    }

    const options = savedQueries.map((query) => ({
      label: createQuery(query),
      type: 'text',
      detail: formatDate(query.lastExecuted.getTime()),
      info: () => createInfo(query).dom,
      apply: () => {
        onApply(query.queryProperties);
      },
      boost: query.lastExecuted.getTime(),
    }));

    return {
      from: context.pos,
      options: options,
    };
  };
};

const queryLabelStyles = css({
  textTransform: 'capitalize',
  fontWeight: 'bold',
  margin: `${spacing[2]}px 0`,
});

const queryCodeStyles = css({
  maxHeight: '30vh',
});

function createQuery(query: SavedQuery): string {
  let res = '';
  Object.entries(query.queryProperties).forEach(([key, value]) => {
    const formattedQuery = toJSString(value);
    const noFilterKey = key === 'filter' ? '' : `${key}: `;
    res += formattedQuery ? `, ${noFilterKey}${formattedQuery}` : '';
  });
  const len = res.length;
  return len <= 100 ? res.slice(2, res.length) : res.slice(2, 100);
}

function createInfo(query: SavedQuery): {
  dom: Node;
  destroy?: () => void;
} {
  const container = document.createElement('div');
  Object.entries(query.queryProperties).forEach(([key, value]) => {
    const formattedQuery = toJSString(value);
    const codeDiv = document.createElement('div');

    const label = document.createElement('label');
    label.className = queryLabelStyles;
    label.textContent = key;

    const code = document.createElement('pre');
    code.className = queryCodeStyles;
    if (formattedQuery) code.textContent = formattedQuery;

    codeDiv.append(label);
    codeDiv.appendChild(code);
    container.appendChild(codeDiv);
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
