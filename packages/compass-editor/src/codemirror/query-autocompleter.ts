import type { Completion, CompletionSource } from '@codemirror/autocomplete';
import { snippetCompletion } from '@codemirror/autocomplete';
import type {
  CompletionOptions,
  CompletionResult as MongoDBCompletionResult,
} from '../autocompleter';
import { completer, wrapField } from '../autocompleter';
import { resolveTokenAtCursor, completeWordsInString } from './utils';
import type { Token } from './utils';

const ID_REGEX = /[a-zA-Z_0-9$\-\u00A2-\u2000\u2070-\uFFFF]+/;

function isPropertyValue(token: Token): boolean {
  // Inside a Property node, the name is the first child. If there's a
  // previous sibling that isn't '[' (computed property bracket), we're
  // past the property name — i.e. in value position.
  return !!(
    token.parent?.name === 'Property' &&
    token.prevSibling &&
    token.prevSibling.name !== '['
  );
}

function toCodemirrorCompletion(
  completion: MongoDBCompletionResult
): Completion {
  const cmCompletion: Completion = {
    label: completion.value,
    apply: wrapField(completion.value, false),
    detail: completion.meta?.startsWith('field') ? 'field' : completion.meta,
    type: completion.meta?.startsWith('field') ? 'property' : 'method',
    info() {
      if (!completion.description) {
        return null;
      }
      const infoNode = document.createElement('div');
      infoNode.classList.add('completion-info');
      infoNode.addEventListener('mousedown', (evt) => {
        if ((evt.target as HTMLElement).nodeName === 'A') {
          evt.preventDefault();
        }
      });
      infoNode.innerHTML = completion.description;
      return infoNode;
    },
  };

  if (completion.snippet) {
    return snippetCompletion(completion.snippet, cmCompletion);
  }

  return cmCompletion;
}

/**
 * Autocompleter for MongoDB queries. Provides context-aware completions:
 * all completions (query operators, BSON constructors, field names) in key
 * and ambiguous positions, BSON-only in value positions (after ':'), and
 * word completions inside strings.
 */
export const createQueryAutocompleter = (
  options: Pick<CompletionOptions, 'fields' | 'serverVersion'> = {}
): CompletionSource => {
  const allCompletions = completer('', {
    meta: ['query', 'bson', 'bson-legacy-uuid', 'field:identifier'],
    ...options,
  });

  const valueCompletions = completer('', {
    meta: ['bson', 'bson-legacy-uuid'],
    ...options,
  });

  return (context) => {
    const token = resolveTokenAtCursor(context);

    if (['BlockComment', 'LineComment'].includes(token.type.name)) {
      return null;
    }

    if (token.type.name === 'String') {
      return completeWordsInString(context);
    }

    const prefix = context.matchBefore(ID_REGEX);
    if (!prefix || prefix.text === '') {
      return null;
    }

    const completions = isPropertyValue(token)
      ? valueCompletions
      : allCompletions;

    return {
      from: prefix.from,
      to: prefix.to,
      options: completions.map((completion) =>
        toCodemirrorCompletion(completion)
      ),
      validFor: ID_REGEX,
    };
  };
};
