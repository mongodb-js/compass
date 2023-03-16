import type { CompletionSource } from '@codemirror/autocomplete';
import { snippetCompletion } from '@codemirror/autocomplete';
import { completer } from '../autocompleter';
import type { CompletionResult } from '../autocompleter';

import {
  resolveTokenAtCursor,
  getAncestryOfToken,
  ARRAY_ITEM_REGEX,
} from './utils';

const rootJsonSchemaCompletion = (from: number, to: number) => ({
  filter: false,
  from,
  to,
  options: [
    snippetCompletion('{\n\t$jsonSchema: {\n\t\t${}\n\t}\n}', {
      label: '$jsonSchema',
      info: 'json-schema validation object',
    }),
  ],
});

const createCompletions = (
  completions: CompletionResult[],
  text: string,
  from: number,
  detail?: string
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
        detail: detail ?? completion.meta,
      })),
  };
};

const isCompletingRequired = (ancestors: string[]) => {
  // Required is always an array.
  return (
    (ancestors[ancestors.length - 1] ?? '').match(ARRAY_ITEM_REGEX) &&
    ancestors[ancestors.length - 2] === 'required'
  );
};

const isCompletingProperties = (ancestors: string[]) => {
  return ancestors[ancestors.length - 1] === 'properties';
};

const isCompletingBsonType = (ancestors: string[]) => {
  // bsonType can either be a string or an array.
  const immediateParent = ancestors[ancestors.length - 1] ?? '';
  return (
    immediateParent === 'bsonType' ||
    (immediateParent.match(ARRAY_ITEM_REGEX) &&
      ancestors[ancestors.length - 2] === 'bsonType')
  );
};

/**
 * The $jsonSchema's required and properties are nested, so we need to
 * get the ancestor to get the correct field name.
 */
const getNestingAncestor = (ancestors: string[]): string => {
  return (
    ancestors
      .filter((x) => !['$jsonSchema'].includes(x))
      .map((x, i, a) => {
        if (['required', 'properties'].includes(x)) {
          return a[i - 1];
        }
      })
      .filter(Boolean)
      // because field names are represented in dot notation
      .join('.')
  );
};

/**
 * As the $jsonSchema's required and properties are nested, we need to filter
 * the fields based on the nesting level (ancestor).
 */
const filterFieldsByParent = (fields: CompletionResult[], ancestor: string) => {
  if (ancestor === '') {
    return fields;
  }

  return fields
    .filter((x) => x.value !== ancestor && x.value.startsWith(ancestor))
    .map((x) => {
      const value = x.value.replace(`${ancestor}.`, '');
      return {
        ...x,
        value,
      };
    })
    .filter((x) => x.value);
};

export const createValidationAutocompleter = (
  fields: string[],
  serverVersion?: string
): CompletionSource => {
  const defaultCompletions = completer('', {
    serverVersion,
    meta: ['json-schema', 'bson', 'query'],
  });
  const fieldCompletions = completer('', {
    fields,
    serverVersion,
    meta: ['field:identifier'],
  });
  const bsonTypeCompletions = completer('', {
    serverVersion,
    meta: ['bson-type-aliases'],
  });

  return (context) => {
    const token = resolveTokenAtCursor(context);
    const document = context.state.sliceDoc(0);
    const textBefore = document
      .slice(token.from, context.pos)
      .replace(/^("|')/, '');

    // At the root level
    if (token.type.isTop) {
      return rootJsonSchemaCompletion(0, document.length);
    }

    if (token.parent?.type.isTop) {
      return createCompletions(
        defaultCompletions,
        textBefore,
        context.pos - textBefore.length
      );
    }

    const ancestors = getAncestryOfToken(token, document);

    if (isCompletingRequired(ancestors) || isCompletingProperties(ancestors)) {
      const ancestor = getNestingAncestor(ancestors);
      return createCompletions(
        filterFieldsByParent(fieldCompletions, ancestor),
        textBefore,
        context.pos - textBefore.length,
        'Field'
      );
    }

    if (isCompletingBsonType(ancestors)) {
      return createCompletions(
        bsonTypeCompletions,
        textBefore,
        context.pos - textBefore.length,
        'BSON Type'
      );
    }

    return createCompletions(
      defaultCompletions,
      textBefore,
      context.pos - textBefore.length
    );
  };
};
