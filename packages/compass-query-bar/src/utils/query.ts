import { validateField } from './validate-query';
import { parse, ParseMode, toJSString } from '@mongodb-js/shell-bson-parser';
import type { UserPreferences } from '@mongodb-js/compass-preferences-model';
import { isEmpty, isEqual, isObject } from 'lodash';
import { prettify } from '@mongodb-js/compass-editor';
import type { Document } from 'mongodb';
import type { QueryAttributes } from './get-query-attributes';
import { getQueryAttributes } from './get-query-attributes';

import {
  DEFAULT_FIELD_VALUES,
  DEFAULT_QUERY_VALUES,
} from '../constants/query-bar-store';
import type {
  BaseQuery,
  QueryFormFieldEntries,
  QueryFormFields,
  QueryProperty,
} from '../constants/query-properties';
import { QUERY_PROPERTIES } from '../constants/query-properties';

export function mapFormFieldsToQuery(fields: QueryFormFields): BaseQuery {
  // We always want filter field to be in the query, even if the field
  // is empty. Probably would be better to handle where the query is
  // actually used, but a lot of code in Compass relies on this
  return {
    filter: {},
    ...Object.fromEntries(
      Object.entries(fields)
        .map(([key, field]) => {
          return [key, field.value];
        })
        .filter(([, value]) => {
          return typeof value !== 'undefined';
        })
    ),
  };
}

// Returns true if any fields that aren't filter have non-default values.
export function doesQueryHaveExtraOptionsSet(fields?: QueryFormFields) {
  if (!fields) {
    return false;
  }

  for (const property of QUERY_PROPERTIES) {
    if (property === 'filter') {
      continue;
    }

    if (
      !isEqual(fields[property].value, DEFAULT_QUERY_VALUES[property]) &&
      !isEqual(fields[property].value, DEFAULT_FIELD_VALUES[property])
    ) {
      return true;
    }
  }
  return false;
}

export function parseQueryAttributesToFormFields(
  query: Record<string, unknown>,
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'maxTimeMSEnvLimit'>
): QueryFormFields {
  return Object.fromEntries(
    Object.entries(query)
      .map(([key, valueString]) => {
        if (!isQueryProperty(key) || typeof valueString !== 'string') {
          return null;
        }
        const value = validateField(key, valueString, preferences);
        const valid = value !== false;
        return [
          key,
          { string: valueString, value: valid ? value : null, valid },
        ];
      })
      .filter((entry): entry is QueryFormFieldEntries[number] => {
        return entry !== null;
      })
  );
}

/**
 * Map query document to the query fields state only preserving valid values
 */
export function mapQueryToFormFields(
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'maxTimeMSEnvLimit'>,
  query?: BaseQuery,
  onlyValid = true
): QueryFormFields {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .map(([key, _value]) => {
        if (!isQueryProperty(key)) {
          return null;
        }
        let valueAsString =
          typeof _value === 'undefined' ? '' : toJSString(_value, 0) || '';

        valueAsString = prettify(valueAsString, 'javascript-expression');

        const value = validateField(key, valueAsString, preferences);
        const valid: boolean = value !== false;
        if (onlyValid && !valid) {
          return null;
        }
        return [
          key,
          { string: valueAsString, value: valid ? value : null, valid },
        ] as const;
      })
      .filter((entry): entry is QueryFormFieldEntries[number] => {
        return entry !== null;
      })
  );
}

function isEmptyValue(value: unknown) {
  return !value || (isObject(value) && isEmpty(value));
}

function getQueryString({ value, string }: { value: unknown; string: string }) {
  return isEmptyValue(value) ? undefined : string;
}

/**
 * Map query fields state to the query strings that are saved in query history,
 * omitting the fields with default values
 */
export function mapFormFieldsToQueryAttributes(
  fields: QueryFormFields
): QueryAttributes {
  return getQueryAttributes({
    filter: getQueryString(fields.filter),
    project: getQueryString(fields.project),
    collation: getQueryString(fields.collation),
    sort: getQueryString(fields.sort),
    hint: getQueryString(fields.hint),
    skip: fields.skip.value,
    limit: fields.limit.value,
  });
}

/**
 * Map saved query strings to the query fields state, keeping invalid fields so
 * that they can be fixed in the editor
 */
export function mapQueryAttributesToFormFields(
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'maxTimeMSEnvLimit'>,
  query: QueryAttributes
): QueryFormFields {
  return {
    ...mapQueryToFormFields(preferences, DEFAULT_FIELD_VALUES),
    ...parseQueryAttributesToFormFields(
      Object.fromEntries(
        Object.entries(getQueryAttributes(query)).map(
          ([key, value]) => [key, String(value)] as const
        )
      ),
      preferences
    ),
  };
}

function toQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  return isEmptyValue(value) ? undefined : toJSString(value);
}

/**
 * Initial queries come from saved queries, but workspace tabs that were saved
 * by older versions of Compass can have parsed query values.
 */
export function toQueryAttributes(
  query: Partial<Record<keyof QueryAttributes, unknown>>
): QueryAttributes {
  return getQueryAttributes({
    filter: toQueryString(query.filter),
    project: toQueryString(query.project),
    collation: toQueryString(query.collation),
    sort: toQueryString(query.sort),
    hint: toQueryString(query.hint),
    update: toQueryString(query.update),
    skip: typeof query.skip === 'number' ? query.skip : undefined,
    limit: typeof query.limit === 'number' ? query.limit : undefined,
  });
}

/**
 * Parse saved query strings so that queries can be compared regardless of how
 * they are formatted
 */
export function parseQueryAttributes(query: QueryAttributes): Document {
  return Object.fromEntries(
    Object.entries(getQueryAttributes(query)).map(
      ([key, value]): [string, unknown] => {
        if (typeof value !== 'string') {
          return [key, value];
        }
        try {
          // Strict mode returns '' for comments and method calls, so all
          // queries using them would be considered equal.
          return [key, parse(value, { mode: ParseMode.Loose })];
        } catch {
          return [key, value];
        }
      }
    )
  );
}

export function isQueryValid(fields: QueryFormFields) {
  return QUERY_PROPERTIES.every((prop) => {
    return fields[prop].valid;
  });
}

function isQueryProperty(field: string): field is QueryProperty {
  return (QUERY_PROPERTIES as readonly string[]).includes(field);
}

export function isEqualDefaultQuery(fields: QueryFormFields): boolean {
  return isEqual(mapFormFieldsToQuery(fields), DEFAULT_QUERY_VALUES);
}
