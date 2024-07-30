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
  lastExecuted: Date;
  queryProperties: {
    [propertyName: string]: any;
  };
};

export const createQueryHistoryAutocompleter = (
  savedQueries: SavedQuery[],
  onApply: (query: SavedQuery['queryProperties']) => void,
  theme: CodemirrorThemeType
): CompletionSource => {
  return function queryCompletions(context: CompletionContext) {
    if (savedQueries.length === 0) {
      return null;
    }

    const maxTime =
      savedQueries[savedQueries.length - 1].lastExecuted.getTime();
    const minTime = savedQueries[0].lastExecuted.getTime();

    const options = savedQueries.map((query) => ({
      label: createQuery(query),
      type: 'query-history',
      detail: formatDate(query.lastExecuted.getTime()),
      info: () => createInfo(query, theme).dom,
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

export function createQuery(query: SavedQuery): string {
  let res = '';
  Object.entries(query.queryProperties).forEach(([key, value]) => {
    const formattedQuery = toJSString(value);
    const noFilterKey = key === 'filter' ? '' : `${key}: `;
    res += formattedQuery ? `, ${noFilterKey}${formattedQuery}` : '';
  });
  return res.slice(2, res.length);
}

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
