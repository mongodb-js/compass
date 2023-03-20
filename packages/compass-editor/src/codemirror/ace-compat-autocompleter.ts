import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from '@codemirror/autocomplete';
import { snippetCompletion } from '@codemirror/autocomplete';
import type { CompletionResult as MongoDBCompletionResult } from '../autocompleter';
import { wrapField } from '../autocompleter';
import { resolveTokenAtCursor } from './utils';
import type { Token } from './utils';

export function mapMongoDBCompletionToCodemirrorCompletion(
  completion: MongoDBCompletionResult,
  escape: 'always' | 'never' | 'invalid' = 'invalid'
): Completion {
  const cmCompletion = {
    label: completion.value,
    apply:
      escape === 'never'
        ? completion.value
        : wrapField(completion.value, escape === 'always'),
    detail: completion.meta?.startsWith('field') ? 'field' : completion.meta,
    info: completion.description,
  };

  if (completion.snippet) {
    return snippetCompletion(completion.snippet, cmCompletion);
  }

  return cmCompletion;
}

type Prefix = { from: number; to: number; text: string };

/**
 * Ace autocompleter "valid" identifier regex
 */
export const ID_REGEX = /[a-zA-Z_0-9$\-\u00A2-\u2000\u2070-\uFFFF]+/;

export function createCompletionResultForIdPrefix({
  prefix,
  completions,
  escape,
}: {
  prefix: Pick<Prefix, 'from' | 'to'>;
  completions: MongoDBCompletionResult[];
  escape?: 'always' | 'never' | 'invalid';
}): CompletionResult {
  return {
    from: prefix.from,
    to: prefix.to,
    options: completions.map((completion) => {
      return mapMongoDBCompletionToCodemirrorCompletion(completion, escape);
    }),
    validFor: ID_REGEX,
  };
}

type AceCompatCompletionSource = (options: {
  prefix: Prefix;
  token: Token;
  context: CompletionContext;
}) => ReturnType<CompletionSource>;

/**
 * Helper method to create a basic autocompleter for codemirror to match our
 * current ace autocompleter behavior:
 *
 * - Ignore empty prefixes and comments
 * - Autocomplete only when cursor is near something that passes as identifier
 * - Have autocopmletion logic split depending on whether or not autocompletion
 *   happens inside a string token or not
 */
export function createAceCompatAutocompleter(completers: {
  String?: AceCompatCompletionSource;
  IdentifierLike?: AceCompatCompletionSource;
}): CompletionSource {
  return function aceCompatAutocompleter(context) {
    const prefix = context.matchBefore(ID_REGEX);
    const token = resolveTokenAtCursor(context);

    if (!prefix || prefix.text === '') {
      return null;
    }

    if (['BlockComment', 'LineComment'].includes(token.type.name)) {
      return null;
    }

    const opts = { context, prefix, token };

    if (token.type.name === 'String' && completers.String) {
      return completers.String(opts) ?? null;
    }

    return completers.IdentifierLike?.(opts) ?? null;
  };
}
