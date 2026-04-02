import type { CompletionSource } from '@codemirror/autocomplete';
import type { CompletionOptions } from '../autocompleter';
import { completer } from '../autocompleter';
import {
  resolveTokenAtCursor,
  completeWordsInString,
  mapMongoDBCompletionToCodemirrorCompletion,
  isPropertyValue,
} from './utils';

/**
 * Autocompleter for MongoDB queries, completes field names, query
 * operators, and bson values based on the context.
 */
export const createQueryAutocompleter = (
  options: Pick<CompletionOptions, 'fields' | 'serverVersion'> = {}
): CompletionSource => {
  const fieldCompletions = completer('', {
    meta: ['query', 'field:identifier'],
    ...options,
  });
  const valueCompletions = completer('', {
    meta: ['bson', 'bson-legacy-uuid'],
    ...options,
  });

  return (context) => {
    const token = resolveTokenAtCursor(context);

    // Don't autocomplete while in a comment.
    if (['BlockComment', 'LineComment'].includes(token.type.name)) {
      return null;
    }
    const prefix = context.state
      .sliceDoc(token.from, context.pos)
      .replace(/^("|')/, '');

    if (!prefix) {
      return null;
    }

    const isValueCompletion = isPropertyValue(token);

    if (isValueCompletion && token.type.name === 'String') {
      return completeWordsInString(context) ?? null;
    }

    const completions = isValueCompletion ? valueCompletions : fieldCompletions;

    return {
      from: token.from,
      to: token.to,
      options: completions
        .filter((completion) =>
          completion.value.toLowerCase().includes(prefix.toLowerCase())
        )
        .map((completion) =>
          mapMongoDBCompletionToCodemirrorCompletion(completion)
        ),
      filter: false,
    };
  };
};
