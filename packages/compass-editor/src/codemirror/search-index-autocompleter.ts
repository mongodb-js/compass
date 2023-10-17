import type { CompletionSource } from '@codemirror/autocomplete';
import type { CompletionOptions } from '../autocompleter';
import { completer } from '../autocompleter';
import {
  ID_REGEX,
  createCompletionResultForIdPrefix,
} from './ace-compat-autocompleter';
import {
  completeWordsInString,
  getAncestryOfToken,
  resolveTokenAtCursor,
} from './utils';

const isCompletingFields = (ancestors: string[]) => {
  return ancestors[ancestors.length - 1] === 'fields';
};

export const createSearchIndexAutocompleter = (
  options: Pick<CompletionOptions, 'fields'> = {}
): CompletionSource => {
  const completions = completer('', {
    meta: ['field:identifier'],
    ...options,
  });

  return (context) => {
    const token = resolveTokenAtCursor(context);
    const document = context.state.sliceDoc(0);
    const prefix = context.matchBefore(ID_REGEX);
    if (!prefix) {
      return null;
    }

    const ancestors = getAncestryOfToken(token, document);

    if (isCompletingFields(ancestors)) {
      return createCompletionResultForIdPrefix({
        prefix,
        completions,
      });
    }

    return completeWordsInString(context);
  };
};
