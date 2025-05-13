import type {
  CompletionContext,
  CompletionSource,
} from '@codemirror/autocomplete';
import {
  fontFamilies,
  formatDate,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import { toJSString } from 'mongodb-query-parser';
import { languages } from '../editor';
import { highlightCode } from '@lezer/highlight';
import { type CodemirrorThemeType, highlightStyles } from '../editor';

export type SavedQuery = {
  id: string;
  type: 'recent' | 'favorite';
  lastExecuted: Date;
  queryProperties: {
    [propertyName: string]: any;
  };
};

function simplifyQueryStringForAutocomplete(queryString: string): string {
  return queryString.replace(/[\s'"\n\t{}},]/g, '').toLowerCase();
}

/**
 * Codemirror runs a fuzzy search on the completion item labels.
 * Oftentimes the fuzzy search will match on too many query history items.
 * We limit the possible results to be improve accuracy.
 * We give suggestions of queries that either match at least one field,
 * or that contain the prefix the user is typing.
 */
function getMatchingQueryHistoryItemsForInput({
  savedQueries,
  queryProperty,
  input: _input,
}: {
  savedQueries: SavedQuery[];
  queryProperty: string;
  input: string;
}) {
  const input = simplifyQueryStringForAutocomplete(_input);

  if (input.length === 0) {
    // Everything matches when empty search.
    return savedQueries;
  }

  return savedQueries.filter((query) => {
    const queryValue = query.queryProperties[queryProperty];

    // Only some query properties are objects. For instance limit can be an array.
    if (typeof queryValue !== 'object') {
      const queryValueString = toJSString(queryValue) || '';
      if (!queryValueString) {
        return false;
      }

      const queryValueSimplified =
        simplifyQueryStringForAutocomplete(queryValueString);
      return queryValueSimplified.startsWith(input);
    }

    // We subtract parts of the string until there's nothing left.
    // We know it's a possible match if the all of the input is found in the query.
    let inputToMatch = input;

    // We check each top level field as they can be in any order.
    for (const [key, value] of Object.entries(queryValue).slice(
      0,
      30 /* Some queries can have a ton of fields, we slice to avoid long loops on each character typed. */
    )) {
      const fieldString = toJSString({ [key]: value }) || '';
      const fieldStringSimplified =
        simplifyQueryStringForAutocomplete(fieldString);

      if (input === fieldStringSimplified) {
        // Don't show an option if the user has typed the whole field.
        return false;
      }

      if (fieldStringSimplified.startsWith(input)) {
        // When the user is typing their first field, we can return early.
        return true;
      }

      const inputIndex = inputToMatch.indexOf(fieldStringSimplified);
      if (inputIndex !== -1) {
        inputToMatch = inputToMatch.replace(fieldStringSimplified, '');
      }
    }

    if (inputToMatch.length === 0) {
      return true;
    }

    return false;
  });
}

export const createQueryHistoryAutocompleter = ({
  savedQueries,
  onApply,
  onDelete,
  queryProperty,
  theme,
}: {
  savedQueries: SavedQuery[];
  onDelete: (queryId: string, type: 'recent' | 'favorite') => void;
  onApply: (query: SavedQuery['queryProperties']) => void;
  queryProperty: string;
  theme: CodemirrorThemeType;
}): CompletionSource => {
  return function queryCompletions(context: CompletionContext) {
    if (savedQueries.length === 0) {
      return null;
    }

    const maxTime =
      savedQueries[savedQueries.length - 1].lastExecuted.getTime();
    const minTime = savedQueries[0].lastExecuted.getTime();

    const contextValue = context.state.sliceDoc(0, context.pos);
    const matchedQueries = getMatchingQueryHistoryItemsForInput({
      savedQueries,
      queryProperty,
      input: contextValue,
    });

    const options = matchedQueries.map((query) => ({
      // Use a display label to show the query property
      // field names before their respective parts.
      displayLabel: createQueryDisplayLabel(query),
      label: createQueryLabel(query, queryProperty),
      type: query.type === 'recent' ? 'query-history' : 'favorite',
      detail: formatDate(query.lastExecuted.getTime()),
      info: () =>
        createInfo({
          query,
          theme,
          onDelete: () => onDelete(query.id, query.type),
        }),
      apply: () => {
        onApply(query.queryProperties);
      },
      // CodeMirror expects boost values to be between -99 and 99
      boost: scaleBetween(
        query.lastExecuted.getTime(),
        -99,
        99,
        minTime,
        maxTime
      ),
    }));

    return {
      from: context.pos,
      options: options,
    };
  };
};

const queryInfoContainerStyles = css({
  minWidth: spacing[800] * 3,
});

const queryLabelStyles = css({
  textTransform: 'capitalize',
  fontWeight: 'bold',
  fontFamily: fontFamilies.default,
  marginTop: `${spacing[100]}px`,
});

const queryCodeStyles = css({
  fontFamily: fontFamilies.code,
  margin: `${spacing[50]}px`,
  marginTop: `${spacing[100]}px`,
  marginLeft: `${spacing[100]}px`,
  padding: 0,
  whiteSpace: 'pre-wrap',
});

const removeButtonStyles = css({
  background: 'none',
  border: 'none',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
  fontSize: 'inherit',
  fontFamily: fontFamilies.default,
  position: 'absolute',
  top: `${spacing[50]}px`,
  right: `${spacing[100]}px`,
  '&:hover': {
    cursor: 'pointer',
  },
});

export function createQueryLabel(
  query: SavedQuery,
  propertyName: string
): string {
  if (!query.queryProperties[propertyName]) {
    return '';
  }

  // The autocompletion uses a fuzzy search on the label, we only want to
  // auto complete property that is being edited, not all of them.
  return toJSString(query.queryProperties[propertyName]) || '';
}

export function createQueryDisplayLabel(query: SavedQuery): string {
  return Object.entries(query.queryProperties)
    .map(([key, value]) => {
      const formattedQuery = toJSString(value, 1);
      if (!formattedQuery) return '';
      // Hide the `filter` key in the display label as it's the default field.
      const fieldKey = key === 'filter' ? '' : `${key}: `;
      return `${fieldKey}${formattedQuery}`;
    })
    .filter(Boolean)
    .reduce((acc, curr) => (acc ? `${acc}, ${curr}` : curr), '');
}

function createRemoveButton({
  onDelete,
}: {
  onDelete: () => void;
}): HTMLButtonElement {
  const button = document.createElement('button');

  button.textContent = 'Remove';
  button.className = removeButtonStyles;
  button.onclick = () => {
    onDelete();
  };
  button.type = 'button';
  button.setAttribute('aria-label', 'Remove query from history');
  button.setAttribute('data-testid', 'remove-query-history-item');

  return button;
}

const javascriptExpressionLanguageParser =
  languages['javascript-expression']().language.parser;

function createInfo({
  query,
  onDelete,
  theme,
}: {
  query: SavedQuery;
  onDelete: () => void;
  theme: CodemirrorThemeType;
}): {
  dom: Node;
  destroy?: () => void;
} {
  const customHighlighter = highlightStyles[theme];
  const container = document.createElement('div');
  container.className = queryInfoContainerStyles;

  Object.entries(query.queryProperties).forEach(([key, value]) => {
    const formattedQuery = toJSString(value);

    const removeButton = createRemoveButton({
      onDelete,
    });
    container.appendChild(removeButton);

    const codeDiv = document.createElement('div');

    const label = document.createElement('label');
    label.className = queryLabelStyles;
    label.textContent = key;

    const code = document.createElement('pre');
    code.className = queryCodeStyles;

    function emit(text: string, classes: string | null) {
      const node = document.createTextNode(text);
      if (classes) {
        const span = document.createElement('span');
        span.appendChild(node);
        span.className = classes;
        code.appendChild(span);
      } else {
        code.appendChild(node);
      }
    }

    function emitBreak() {
      code.appendChild(document.createTextNode('\n'));
    }

    if (formattedQuery) {
      highlightCode(
        formattedQuery,
        javascriptExpressionLanguageParser.parse(formattedQuery),
        customHighlighter,
        emit,
        emitBreak
      );
    }

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
      container.remove();
    },
  };
}

// scales a number unscaledNum between [newScaleMin, newScaleMax]
export function scaleBetween(
  unscaledNum: number,
  newScaleMin: number,
  newScaleMax: number,
  originalScaleMin: number,
  originalScaleMax: number
): number {
  // returns midpoint of new range if original range is of size 0
  if (originalScaleMax === originalScaleMin)
    return newScaleMin + (newScaleMax - newScaleMin) / 2;
  return (
    ((newScaleMax - newScaleMin) * (unscaledNum - originalScaleMin)) /
      (originalScaleMax - originalScaleMin) +
    newScaleMin
  );
}
