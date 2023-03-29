import { gte } from 'semver';
import {
  ACCUMULATORS,
  BSON_TYPES,
  BSON_TYPE_ALIASES,
  CONVERSION_OPERATORS,
  EXPRESSION_OPERATORS,
  JSON_SCHEMA,
  QUERY_OPERATORS,
  STAGE_OPERATORS,
} from '@mongodb-js/mongodb-constants';

const DEFAULT_SERVER_VERSION = '999.999.999';

const ALL_COMPLETIONS = [
  ...ACCUMULATORS,
  ...BSON_TYPES,
  ...BSON_TYPE_ALIASES,
  ...CONVERSION_OPERATORS,
  ...EXPRESSION_OPERATORS,
  ...JSON_SCHEMA,
  ...QUERY_OPERATORS,
  ...STAGE_OPERATORS,
];

type Meta =
  | typeof ALL_COMPLETIONS[number]['meta']
  | 'field:identifier'
  | 'field:reference';

/**
 * Our completions are a mix of ace autocompleter types and some custom values
 * added on top, this interface provides a type definition for all required
 * properties that completer is using
 * @internal
 */
export type Completion = {
  value: string;
  version: string;
  meta: Meta;
  description?: string;
  snippet?: string;
  score?: number;
};

function matchesMeta(filter: string[], meta: string) {
  const metaParts = meta.split(':');
  return filter.some((metaFilter) => {
    const filterParts = metaFilter.split(':');
    return (
      filterParts.length === metaParts.length &&
      filterParts.every((part, index) => {
        return part === '*' || part === metaParts[index];
      })
    );
  });
}

export function createCompletionFilter(
  prefix: string,
  serverVersion: string,
  filterMeta?: string[]
) {
  const currentServerVersion =
    serverVersion.match(/^(?<version>\d+?\.\d+?\.\d+?)/)?.groups?.version ??
    DEFAULT_SERVER_VERSION;
  return ({ value, version: minServerVersion, meta }: Completion) => {
    return (
      value.toLowerCase().startsWith(prefix.toLowerCase()) &&
      gte(currentServerVersion, minServerVersion) &&
      (!filterMeta || matchesMeta(filterMeta, meta))
    );
  };
}

export type CompleteOptions = {
  // Current server version (default is 999.999.999)
  serverVersion?: string;
  // Additional fields that are part of the document schema to add to
  // autocomplete as identifiers and identifier references
  fields?: (string | { name: string; description?: string })[];
  // Filter completions by completion value type
  meta?: (Meta | 'field:*' | 'accumulator:*' | 'expr:*')[];
};

export type CompletionResult = {
  // Autocomplete value that prefix was matched on
  value: string;
  // Value type
  meta?: string;
  // Longer description
  description?: string;
  // String representing a possible snippet completion
  snippet?: string;
  // For ace compat
  score: number;
};

function isValidIdentifier(identifier: string) {
  // Quick check for common case first
  if (/[.\s"'()[\];={}]/.test(identifier)) {
    return false;
  }
  try {
    // Everything else we check using eval as regex methods of checking are quite
    // hard to do (see https://mathiasbynens.be/notes/javascript-identifiers-es6)
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(`"use strict";let ${identifier};`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper method to conditionally wrap completion value if it's not a valid
 * identifier
 */
export function wrapField(field: string, force = false) {
  return force || !isValidIdentifier(field)
    ? `"${field.replace(/["\\]/g, '\\$&')}"`
    : field;
}

function normalizeField(
  field: string | { name: string; description?: string }
) {
  return typeof field === 'string'
    ? { value: field }
    : {
        value: field.name,
        description: field.description,
      };
}

export function completer(
  prefix = '',
  options: CompleteOptions = {},
  completions: Completion[] = ALL_COMPLETIONS
): CompletionResult[] {
  const { serverVersion = DEFAULT_SERVER_VERSION, fields = [], meta } = options;
  const completionsFilter = createCompletionFilter(prefix, serverVersion, meta);
  const completionsWithFields = ([] as Completion[]).concat(
    completions,
    fields.flatMap((field) => {
      const { value, description } = normalizeField(field);

      return [
        {
          value: value,
          meta: 'field:identifier',
          version: '0.0.0',
          description,
        },
        {
          value: `$${value}`,
          meta: 'field:reference',
          version: '0.0.0',
          description,
        },
      ];
    })
  );

  return completionsWithFields
    .filter((completion) => {
      return completionsFilter(completion);
    })
    .map((completion) => {
      return {
        value: completion.value,
        meta: completion.meta,
        score: completion.score ?? 1,
        ...(completion.description && { description: completion.description }),
        ...(completion.snippet && { snippet: completion.snippet }),
      };
    });
}
