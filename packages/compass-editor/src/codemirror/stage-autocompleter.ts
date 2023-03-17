import type { CompletionSource } from '@codemirror/autocomplete';
import type { CompleteOptions } from '../autocompleter';
import { completer } from '../autocompleter';
import {
  completeWordsInString,
  createAceCompatAutocompleter,
  createCompletionResultForIdPrefix,
} from './ace-compat-autocompleter';
import { createQueryAutocompleter } from './query-autocompleter';

/**
 * Autocompleter for the document object, only autocompletes field names in the
 * appropriate format (either escaped or not) both for javascript and json modes
 */
export const createStageAutocompleter = ({
  stageOperator,
  ...options
}: Pick<CompleteOptions, 'fields' | 'serverVersion'> & {
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
