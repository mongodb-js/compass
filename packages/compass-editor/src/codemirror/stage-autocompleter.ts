import type { CompletionSource } from '@codemirror/autocomplete';
import type { CompletionOptions } from '../autocompleter';
import { completer } from '../autocompleter';
import {
  createAceCompatAutocompleter,
  createCompletionResultForIdPrefix,
} from './ace-compat-autocompleter';
import { aggLink, completeWordsInString } from './utils';
import { createQueryAutocompleter } from './query-autocompleter';

export const createStageAutocompleter = ({
  stageOperator,
  ...options
}: Pick<CompletionOptions, 'fields' | 'serverVersion'> & {
  stageOperator?: string;
} = {}): CompletionSource => {
  const queryAutocompleter = createQueryAutocompleter(options);

  const fieldsReferenceCompletions = completer('', {
    ...options,
    meta: ['field:reference'],
  });

  const stageCompletions = completer('', {
    ...options,
    meta: [
      'expr:*',
      'conv',
      'bson',
      'field:identifier',
      ...(['$project', '$group'].includes(stageOperator ?? '')
        ? (['accumulator', 'accumulator:*'] as const)
        : []),
    ],
  }).map((completion) => {
    if (completion.meta?.startsWith('expr:')) {
      return {
        ...completion,
        description: `<p>${aggLink(completion.value)} pipeline operator</p>`,
      };
    }

    return completion;
  });

  return createAceCompatAutocompleter({
    String({ prefix, context }) {
      if (prefix.text.startsWith('$')) {
        return createCompletionResultForIdPrefix({
          prefix,
          completions: fieldsReferenceCompletions,
          // We don't need escaping, we are inside a string
          escape: 'never',
        });
      }

      return completeWordsInString(context);
    },
    IdentifierLike({ prefix, context }) {
      if (stageOperator === '$match') {
        return queryAutocompleter(context);
      }
      return createCompletionResultForIdPrefix({
        prefix,
        completions: stageCompletions,
      });
    },
  });
};
