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
import { parse, ParseMode, toJSString } from '@mongodb-js/shell-bson-parser';
import { languages } from '../editor';
import { highlightCode } from '@lezer/highlight';
import { type CodemirrorThemeType, highlightStyles } from '../editor';

export type SavedQueryProperties = {
  [propertyName: string]: string | number | undefined;
};

export type SavedQuery<T extends SavedQueryProperties = SavedQueryProperties> =
  {
    type: string;
    lastExecuted: Date;
    queryProperties: T;
  };

type PreparedField = {
  simplified: string;
};

type PreparedQuery<T extends SavedQueryProperties = SavedQueryProperties> = {
  query: SavedQuery<T>;
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
  // The autocompletion uses a fuzzy search on the label, we only want to
  // auto complete property that is being edited, not all of them.
  return String(query.queryProperties[propertyName] ?? '');
}

export function createQueryDisplayLabel(query: SavedQuery): string {
  return Object.entries(query.queryProperties)
    .map(([key, value]) => {
      if (value === undefined || value === '') return '';
      // Hide the `filter` key in the display label as it's the default field.
      const fieldKey = key === 'filter' ? '' : `${key}: `;
      return `${fieldKey}${value}`;
    })
    .filter(Boolean)
    .reduce((acc, curr) => (acc ? `${acc}, ${curr}` : curr), '');
}

function simplifyQueryStringForAutocomplete(queryString: string): string {
  return queryString.replace(/[\s'"\n\t{}},]/g, '').toLowerCase();
}

// Matching is done on the top level fields, so objects have to be parsed.
function parseQueryValue(
  value: string | number | undefined
): { value: unknown } | undefined {
  try {
    return {
      value:
        typeof value === 'string'
          ? parse(value, { mode: ParseMode.Loose })
          : value,
    };
  } catch {
    return undefined;
  }
}

function prepareQueries<T extends SavedQueryProperties>(
  savedQueries: SavedQuery<T>[],
  queryProperty: string
): PreparedQuery<T>[] {
  if (!queryProperty) {
    return [];
  }
  return savedQueries
    .map((query) => {
      const savedValue = query.queryProperties[queryProperty];
      const parsed = parseQueryValue(savedValue);
      // Don't suggest saved queries that are no longer valid.
      if (!parsed) {
        return null;
      }
      const queryString = String(savedValue ?? '');
      const queryValue = parsed.value;
      // Only some query properties are objects for instance limit is a scalar.
      const isObject = typeof queryValue === 'object' && queryValue !== null;

      let scalarSimplified = '';
      let fields: PreparedField[] = [];

      if (!isObject) {
        if (queryString.length > MAX_VALUE_LENGTH) {
          return null;
        }
        scalarSimplified = simplifyQueryStringForAutocomplete(queryString);
      } else {
        const queryIsArray = Array.isArray(queryValue);
        // We only support autocompletion for objects and arrays of key value pairs.
        if (
          queryIsArray &&
          queryValue.some(
            (value: any) =>
              typeof value !== 'object' ||
              Array.isArray(value) ||
              value.length !== 2
          )
        ) {
          return null;
        }

        // Sort can be an array of key values, or an object, we want to support both.
        const queryIterable: [string, unknown][] = queryIsArray
          ? queryValue
          : Object.entries(queryValue);

        fields = queryIterable
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
          fields.length === 0 ||
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
    .filter((query): query is PreparedQuery<T> => query !== null);
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
function getMatchingPreparedQueries<T extends SavedQueryProperties>(
  preparedQueries: PreparedQuery<T>[],
  input: string
): PreparedQuery<T>[] {
  const simplifiedInput = simplifyQueryStringForAutocomplete(input);

  if (simplifiedInput.length === 0) {
    // Everything matches when empty search.
    return preparedQueries;
  }

  const results: PreparedQuery<T>[] = [];
  for (const query of preparedQueries) {
    if (results.length >= MAX_RESULTS) break;
    if (matchesPreparedQuery(query, simplifiedInput)) {
      results.push(query);
    }
  }
  return results;
}

export const createQueryHistoryAutocompleter = <
  T extends SavedQueryProperties,
>({
  savedQueries,
  onApply,
  queryProperty,
  theme,
}: {
  savedQueries: SavedQuery<T>[];
  onApply: (query: T) => void;
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

    const options = matchedQueries.map((query) => ({
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
    const formattedQuery = String(value ?? '');
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
