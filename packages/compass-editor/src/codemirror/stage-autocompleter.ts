import type { CompletionSource } from '@codemirror/autocomplete';
import type { CompletionOptions } from '../autocompleter';
import { completer } from '../autocompleter';
import {
  mapMongoDBCompletionToCodemirrorCompletion,
  ID_REGEX,
} from './ace-compat-autocompleter';
import { aggLink, completeWordsInString, resolveTokenAtCursor } from './utils';
import { createQueryAutocompleter } from './query-autocompleter';

export const createStageAutocompleter = ({
  stageOperator,
  utmSource,
  utmMedium,
  ...options
}: Pick<
  CompletionOptions,
  'fields' | 'serverVersion' | 'utmSource' | 'utmMedium'
> & {
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
        description: `<p>${aggLink(completion.value, {
          utmSource,
          utmMedium,
        })} pipeline operator</p>`,
      };
    }

    return completion;
  });

  return (context) => {
    const prefix = context.matchBefore(ID_REGEX);
    const token = resolveTokenAtCursor(context);

    if (!prefix || prefix.text === '') {
      return null;
    }

    if (['BlockComment', 'LineComment'].includes(token.type.name)) {
      return null;
    }

    if (token.type.name === 'String') {
      if (prefix.text.startsWith('$')) {
        return {
          from: prefix.from,
          to: prefix.to,
          options: fieldsReferenceCompletions.map((completion) =>
            mapMongoDBCompletionToCodemirrorCompletion(completion, 'never')
          ),
          validFor: ID_REGEX,
        };
      }
      return completeWordsInString(context);
    }

    if (stageOperator === '$match') {
      return queryAutocompleter(context);
    }

    return {
      from: prefix.from,
      to: prefix.to,
      options: stageCompletions.map((completion) =>
        mapMongoDBCompletionToCodemirrorCompletion(completion)
      ),
      validFor: ID_REGEX,
    };
  };
};
