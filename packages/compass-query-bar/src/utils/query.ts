import { validateField } from './validate-query';
import { toJSString } from '@mongodb-js/shell-bson-parser';
import type { UserPreferences } from 'compass-preferences-model';
import { isEqual } from 'lodash';
import { prettify } from '@mongodb-js/compass-editor';

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

export async function parseQueryAttributesToFormFields(
  query: Record<string, unknown>,
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'maxTimeMSEnvLimit'>
): Promise<QueryFormFields> {
  const entries = await Promise.all(
    Object.entries(query).map(async ([key, valueString]) => {
      if (!isQueryProperty(key) || typeof valueString !== 'string') {
        return null;
      }
      const value = await validateField(key, valueString, preferences);
      const valid = value !== false;
      return [key, { string: valueString, value: valid ? value : null, valid }];
    })
  );
  return Object.fromEntries(
    entries.filter((entry): entry is QueryFormFieldEntries[number] => {
      return entry !== null;
    })
  );
}

/**
 * Map query document to the query fields state only preserving valid values
 */
export async function mapQueryToFormFields(
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'maxTimeMSEnvLimit'>,
  query?: BaseQuery,
  onlyValid = true
): Promise<QueryFormFields> {
  const entries = await Promise.all(
    Object.entries(query ?? {}).map(async ([key, _value]) => {
      if (!isQueryProperty(key)) {
        return null;
      }
      let valueAsString =
        typeof _value === 'undefined' ? '' : toJSString(_value, 0) || '';

      valueAsString = prettify(valueAsString, 'javascript-expression');

      const value = await validateField(key, valueAsString, preferences);
      const valid: boolean = value !== false;
      if (onlyValid && !valid) {
        return null;
      }
      return [
        key,
        { string: valueAsString, value: valid ? value : null, valid },
      ] as const;
    })
  );
  return Object.fromEntries(
    entries.filter((entry): entry is QueryFormFieldEntries[number] => {
      return entry !== null;
    })
  );
}

/**
 * Form fields for an empty query. Empty fields validate to their defaults
 * without parsing, so unlike mapQueryToFormFields this can stay synchronous.
 */
export function getDefaultFormFields(): QueryFormFields {
  return Object.fromEntries(
    QUERY_PROPERTIES.map((property) => [
      property,
      { string: '', value: DEFAULT_QUERY_VALUES[property], valid: true },
    ])
  ) as QueryFormFields;
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
