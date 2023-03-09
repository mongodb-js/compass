import type {
  Completion,
  CompletionContext,
  CompletionSource,
} from '@codemirror/autocomplete';
import { snippetCompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { completeAnyWord, ifIn } from '@codemirror/autocomplete';
import type { CompleteOptions } from '../autocompleter';
import { completer, wrapField } from '../autocompleter';

const completeWordsInString = ifIn(['String'], completeAnyWord);

function resolveTokenAtCursor(context: CompletionContext) {
  return syntaxTree(context.state).resolveInner(context.pos, -1);
}

/**
 * Ace autocopmleter "valid" identifier regex
 */
const ID_REGEX = /[a-zA-Z_0-9$\-\u00A2-\u2000\u2070-\uFFFF]+/;

/**
 * Autocompleter for the document object, only autocompletes field names in the
 * appropriate format (either escaped or not) both for javascript and json modes
 */
export const createQueryAutocompleter = (
  options: Pick<CompleteOptions, 'fields' | 'serverVersion'> = {}
): CompletionSource => {
  const completions = completer('', {
    meta: ['query', 'bson', 'field:identifier'],
    ...options,
  }).map((completion): Completion => {
    const cmCompletion = {
      label: completion.value,
      apply: wrapField(completion.value),
      detail: completion.meta,
      info: completion.description,
    };

    if (completion.snippet) {
      return snippetCompletion(completion.snippet, cmCompletion);
    }

    return cmCompletion;
  });

  return (context) => {
    const prefixMatch = context.matchBefore(ID_REGEX);
    const token = resolveTokenAtCursor(context);

    if (!prefixMatch || prefixMatch.text === '') {
      return null;
    }

    if (token.type.name === 'String') {
      return completeWordsInString(context);
    }

    return {
      from: prefixMatch.from,
      to: prefixMatch.to,
      // We dont do any filtering as codemirror fuzzy match is doing a pretty
      // good job here
      options: completions,
      validFor: ID_REGEX,
    };
  };
};
