import type { EditorState } from '@codemirror/state';
import { STAGE_OPERATOR_NAMES } from '@mongodb-js/mongodb-constants';
import type { CompletionOptions } from '../autocompleter';
import { completer } from '../autocompleter';
import type { Token } from './utils';
import { parents } from './utils';
import { getPropertyNameFromPropertyToken, isTokenEqual } from './utils';
import { aggLink, padLines } from './utils';
import { createCompletionResultForIdPrefix } from './ace-compat-autocompleter';
import { createAceCompatAutocompleter } from './ace-compat-autocompleter';
import { createStageAutocompleter } from './stage-autocompleter';

const StageOperatorNames = new Set(STAGE_OPERATOR_NAMES as string[]);

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
  options: Pick<CompletionOptions, 'fields' | 'serverVersion'> = {}
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
            ...(completion.description && {
              description:
                `<p>${aggLink(opName)} pipeline stage</p>` +
                `<p>${completion.description}</p>`,
            }),
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
