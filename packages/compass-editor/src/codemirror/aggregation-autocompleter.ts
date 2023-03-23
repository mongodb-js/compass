import type { EditorState } from '@codemirror/state';
import { STAGE_OPERATOR_NAMES } from '@mongodb-js/mongodb-constants';
import type { CompleteOptions } from '../autocompleter';
import { completer } from '../autocompleter';
import type { Token } from './utils';
import { createCompletionResultForIdPrefix } from './ace-compat-autocompleter';
import { createAceCompatAutocompleter } from './ace-compat-autocompleter';
import { createStageAutocompleter } from './stage-autocompleter';

const StageOperatorNames = new Set(STAGE_OPERATOR_NAMES as string[]);

function* parents(token: Token) {
  let parent: Token | null = token;
  while ((parent = parent.parent)) {
    yield parent;
  }
}

function removeQuotes(str: string) {
  return str.replace(/(^('|")|('|")$)/g, '');
}

// lezer tokens are immutable, we check position in syntax tree to make sure we
// are looking at the same token
function isTokenEqual(a: Token, b: Token) {
  return a.from === b.from && a.to === b.to;
}

function getPropertyNameFromPropertyToken(
  editorState: EditorState,
  propertyToken: Token
): string {
  if (!propertyToken.firstChild) {
    return '';
  }
  return removeQuotes(getTokenText(editorState, propertyToken.firstChild));
}

function padLines(str: string, pad = '  ') {
  return str
    .split('\n')
    .map((line) => `${pad}${line}`)
    .join('\n');
}

function getTokenText(editorState: EditorState, token: Token) {
  return editorState.sliceDoc(token.from, token.to);
}

function getStageNameForToken(
  editorState: EditorState,
  token: Token
): string | null {
  for (const parent of parents(token)) {
    if (parent.name === 'Property') {
      const propertyName = getPropertyNameFromPropertyToken(
        editorState,
        parent
      );
      if (
        parent.firstChild &&
        // We are inside a stage, but not right at the stage name token (we
        // don't want to autocomplete as stage while the stage is being typed)
        !isTokenEqual(parent.firstChild, token) &&
        StageOperatorNames.has(propertyName)
      ) {
        return propertyName;
      }
    }
  }
  return null;
}

export function createAggregationAutocompleter(
  options: Pick<CompleteOptions, 'fields' | 'serverVersion'> = {}
) {
  const stageAutocompletions = completer('', { ...options, meta: ['stage'] });

  return createAceCompatAutocompleter({
    IdentifierLike({ context, prefix, token }) {
      const stageOperator = getStageNameForToken(context.state, token);

      if (stageOperator) {
        return createStageAutocompleter({ stageOperator, ...options })(context);
      }

      const isInsideBlock =
        token.name === 'PropertyName' || token.parent?.name === 'Property';

      return createCompletionResultForIdPrefix({
        prefix,
        completions: stageAutocompletions.map((completion) => {
          const opName = completion.value;
          return {
            ...completion,
            ...(completion.snippet && {
              snippet: !isInsideBlock
                ? `{\n${padLines(`${opName}: ${completion.snippet}`)}\n}`
                : `${opName}: ${completion.snippet}`,
            }),
          };
        }),
      });
    },
  });
}
