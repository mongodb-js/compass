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
  type: string;
  lastExecuted: Date;
  queryProperties: {
    [propertyName: string]: any;
  };
};

type PreparedField = {
  simplified: string;
};

type PreparedQuery = {
  query: SavedQuery;
  label: string;
  displayLabel: string;
  isObject: boolean;
  scalarSimplified: string;
  fields: PreparedField[];
};

const MAX_RESULTS = 10;
const MAX_FIELDS = 10;
const MAX_VALUE_LENGTH = 200;

const queryLabelStyles = css({
  textTransform: 'capitalize',
  fontWeight: 'bold',
  fontFamily: fontFamilies.default,
});

const queryCodeStyles = css({
  fontFamily: fontFamilies.code,
  margin: `${spacing[50]}px`,
  marginLeft: `${spacing[100]}px`,
  padding: 0,
  whiteSpace: 'pre-wrap',
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

function simplifyQueryStringForAutocomplete(queryString: string): string {
  return queryString.replace(/[\s'"\n\t{}},]/g, '').toLowerCase();
}

function prepareQueries(
  savedQueries: SavedQuery[],
  queryProperty: string
): PreparedQuery[] {
  return savedQueries
    .map((query) => {
      const queryValue = query.queryProperties[queryProperty];
      // Only some query properties are objects. For instance sort can be an array.
      const isObject = typeof queryValue === 'object';

      let scalarSimplified = '';
      let fields: PreparedField[] = [];

      if (!queryValue) {
        return null;
      }

      if (!isObject) {
        if (queryValue.length && queryValue.length > MAX_VALUE_LENGTH) {
          return null;
        }

        const str = toJSString(queryValue) || '';
        if (!str || str.length > MAX_VALUE_LENGTH) {
          return null;
        }
        scalarSimplified = str ? simplifyQueryStringForAutocomplete(str) : '';
      } else if (queryValue) {
        fields = Object.entries(queryValue)
          // Some queries can have a ton of fields, we slice to avoid long loops on each character typed.
          .slice(0, MAX_FIELDS)
          .map(([key, value]) => {
            // We don't provide matching on array or object values, as they can be
            // very long and we want to prioritize matching on field names.
            const fieldValue =
              typeof value === 'object' || Array.isArray(value) ? '' : value;

            const fieldString = toJSString({ [key]: fieldValue }) || '';
            return {
              simplified: simplifyQueryStringForAutocomplete(fieldString),
            };
          });

        // Prioritize performance over showing every query.
        if (
          fields.some((field) => field.simplified.length > MAX_VALUE_LENGTH)
        ) {
          return null;
        }
      }

      return {
        query,
        label: createQueryLabel(query, queryProperty),
        displayLabel: createQueryDisplayLabel(query),
        isObject,
        scalarSimplified,
        fields,
      };
    })
    .filter((query): query is PreparedQuery => query !== null);
}

function matchesPreparedQuery(query: PreparedQuery, input: string): boolean {
  if (!query.isObject) {
    return (
      query.scalarSimplified !== '' && query.scalarSimplified.startsWith(input)
    );
  }

  let inputToMatch = input;

  for (const field of query.fields) {
    // Don't show an option if the user has typed the whole field.
    if (input === field.simplified) return false;

    // When the user is typing their first field, we can return early.
    if (field.simplified.startsWith(input)) return true;

    const inputIndex = inputToMatch.indexOf(field.simplified);
    if (inputIndex !== -1) {
      inputToMatch = inputToMatch.replace(field.simplified, '');
    }
  }

  return inputToMatch.length === 0;
}

/**
 * Codemirror runs a fuzzy search on the completion item labels.
 * Oftentimes the fuzzy search will match on too many query history items.
 * We limit the possible results to be improve accuracy.
 * We give suggestions of queries that either match at least one field,
 * or that contain the prefix the user is typing.
 */
function getMatchingPreparedQueries(
  preparedQueries: PreparedQuery[],
  input: string
): PreparedQuery[] {
  const simplifiedInput = simplifyQueryStringForAutocomplete(input);

  if (simplifiedInput.length === 0) {
    // Everything matches when empty search.
    return preparedQueries;
  }

  const results: PreparedQuery[] = [];
  for (const query of preparedQueries) {
    if (results.length >= MAX_RESULTS) break;
    if (matchesPreparedQuery(query, simplifiedInput)) {
      results.push(query);
    }
  }
  return results;
}

export const createQueryHistoryAutocompleter = ({
  savedQueries,
  onApply,
  queryProperty,
  theme,
}: {
  savedQueries: SavedQuery[];
  onApply: (query: SavedQuery['queryProperties']) => void;
  queryProperty: string;
  theme: CodemirrorThemeType;
}): CompletionSource => {
  const preparedQueries = prepareQueries(savedQueries, queryProperty);

  return function queryCompletions(context: CompletionContext) {
    if (preparedQueries.length === 0) {
      return null;
    }

    const maxTime =
      savedQueries[savedQueries.length - 1].lastExecuted.getTime();
    const minTime = savedQueries[0].lastExecuted.getTime();

    const contextValue = context.state.sliceDoc(0, context.pos);

    const matchedQueries = getMatchingPreparedQueries(
      preparedQueries,
      contextValue
    );

    const options = matchedQueries.map((query: PreparedQuery) => ({
      // Use a display label to show the query property
      // field names before their respective parts.
      displayLabel: query.displayLabel,
      label: query.label,
      type: query.query.type === 'recent' ? 'query-history' : 'favorite',
      detail: formatDate(query.query.lastExecuted.getTime()),
      info: () => createInfo(query.query, theme).dom,
      apply: () => {
        onApply(query.query.queryProperties);
      },
      // CodeMirror expects boost values to be between -99 and 99
      boost: scaleBetween(
        query.query.lastExecuted.getTime(),
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

const javascriptExpressionLanguageParser =
  languages['javascript-expression']().language.parser;

function createInfo(
  query: SavedQuery,
  theme: CodemirrorThemeType
): {
  dom: Node;
  destroy?: () => void;
} {
  const customHighlighter = highlightStyles[theme];
  const container = document.createElement('div');

  Object.entries(query.queryProperties).forEach(([key, value]) => {
    const formattedQuery = toJSString(value);
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
