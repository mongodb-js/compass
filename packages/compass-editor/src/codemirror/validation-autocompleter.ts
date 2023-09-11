import type { CompletionSource } from '@codemirror/autocomplete';
import { snippetCompletion } from '@codemirror/autocomplete';
import { completer } from '../autocompleter';
import type { CompletionResult, CompletionOptions } from '../autocompleter';

import { resolveTokenAtCursor, getAncestryOfToken } from './utils';
import {
  createCompletionResultForIdPrefix,
  ID_REGEX,
} from './ace-compat-autocompleter';
import { createQueryAutocompleter } from './query-autocompleter';

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

const isCompletingRequired = (ancestors: string[]) => {
  // Required is always an array.
  return ancestors[ancestors.length - 2] === 'required';
};

const isCompletingProperties = (ancestors: string[]) => {
  return ancestors[ancestors.length - 1] === 'properties';
};

const isCompletingBsonType = (ancestors: string[]) => {
  // bsonType can either be a string or an array.
  const immediateParent = ancestors[ancestors.length - 1] ?? '';
  return (
    immediateParent === 'bsonType' ||
    ancestors[ancestors.length - 2] === 'bsonType'
  );
};

const isCompletingQueryOperator = (
  ancestors: string[],
  operators: string[]
) => {
  // The query operators also has a $jsonSchema, so we need to filter
  // that out as the context in that case is jsonSchema and not query.
  return ancestors
    .filter((x) => x !== '$jsonSchema')
    .some((x) => operators.includes(x));
};

/**
 * The $jsonSchema's *required* and *properties* fields are nested,
 * so we need to get the ancestor to get the correct field name.
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
 * As the $jsonSchema's *required* and *properties* fields are nested,
 * we need to filter the fields based on the nesting level (ancestor).
 */
const filterFieldsByAncestor = (
  fields: CompletionResult[],
  ancestor: string
) => {
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
  options: Pick<CompletionOptions, 'fields' | 'serverVersion'> = {}
): CompletionSource => {
  const defaultCompletions = completer('', {
    meta: ['json-schema', 'bson', 'query'],
    ...options,
  });
  const fieldCompletions = completer('', {
    meta: ['field:identifier'],
    ...options,
  });
  const bsonTypeCompletions = completer('', {
    meta: ['bson-type-aliases'],
    ...options,
  });
  const queryAutocompleter = createQueryAutocompleter(options);

  const queryCompletions = completer('', {
    meta: ['query'],
    ...options,
  });
  const queryOperators = queryCompletions.map((x) => x.value);

  return (context) => {
    const token = resolveTokenAtCursor(context);
    const document = context.state.sliceDoc(0);
    const prefix = context.matchBefore(ID_REGEX);

    // At the root level
    if (token.type.isTop) {
      return rootJsonSchemaCompletion(0, document.length);
    }

    if (!prefix) {
      return null;
    }

    const ancestors = getAncestryOfToken(token, document);
    // At the root object {} level.
    if (ancestors.length === 0) {
      return createCompletionResultForIdPrefix({
        prefix,
        completions: queryCompletions,
      });
    }

    if (isCompletingQueryOperator(ancestors, queryOperators)) {
      return queryAutocompleter(context);
    }

    if (isCompletingRequired(ancestors) || isCompletingProperties(ancestors)) {
      const ancestor = getNestingAncestor(ancestors);
      return createCompletionResultForIdPrefix({
        prefix,
        completions: filterFieldsByAncestor(fieldCompletions, ancestor),
      });
    }

    if (isCompletingBsonType(ancestors)) {
      return createCompletionResultForIdPrefix({
        prefix,
        completions: bsonTypeCompletions,
        escape: 'always',
      });
    }

    return createCompletionResultForIdPrefix({
      prefix,
      completions: defaultCompletions,
    });
  };
};
