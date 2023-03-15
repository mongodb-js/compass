import type { CompletionSource } from '@codemirror/autocomplete';
import { snippetCompletion } from '@codemirror/autocomplete';
import { completer, CompletionResult } from '../autocompleter';

import type { Token } from './utils';
import { resolveTokenAtCursor, completeWordsInString } from './utils';

const rootJsonSchemaCompletion = (from: number, to: number) => ({
  filter: false,
  from,
  to,
  options: [
    snippetCompletion('{\n\t"$jsonSchema": {\n\t\t${}\n\t}\n}', {
      label: '$jsonSchema',
      info: 'json-schema validation object',
    }),
  ],
});

const createCompletions = (
  completions: CompletionResult[],
  text: string,
  from: number
) => {
  return {
    from,
    filter: false,
    options: completions
      .filter((completion) => {
        return completion.value.toLowerCase().startsWith(text.toLowerCase());
      })
      .map((completion) => ({
        ...completion,
        label: completion.value,
        info: completion.description,
        detail: completion.meta,
      })),
  };
};

const isCompletingStringArray = (token: Token): boolean => {
  return token.name === 'String' && token.parent?.name === 'Array';
};

export const createValidationAutocompleter = (
  fields: string[],
  serverVersion?: string
): CompletionSource => {
  const fieldCompletions = completer('', {
    fields,
    serverVersion,
    meta: ['field:identifier'],
  });
  const bsonCompletions = completer('', {
    serverVersion,
    meta: ['bson-type-aliases'],
  });

  const jsonSchemaCompletions = completer('', {
    serverVersion,
    meta: ['json-schema', 'query', 'bson'],
  });

  return (context) => {
    const token = resolveTokenAtCursor(context);
    const document = context.state.sliceDoc(0);
    const textBefore = document
      .slice(token.from, context.pos)
      .replace(/^("|')/, '');

    if (token.type.isTop) {
      return rootJsonSchemaCompletion(0, document.length);
    }

    if (isCompletingStringArray(token)) {
      return createCompletions(
        [...fieldCompletions, ...bsonCompletions],
        textBefore,
        token.from + 1
      );
    }

    if (token.name === 'String') {
      return completeWordsInString(context);
    }

    return createCompletions(
      jsonSchemaCompletions,
      textBefore,
      context.pos - textBefore.length
    );
  };
};
