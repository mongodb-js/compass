import { toJSString, validate } from 'mongodb-query-parser';
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

// Data Explorer limits (5 minutes = 300,000ms)
const WEB_MAX_TIME_MS_LIMIT = 300_000; // 5 minutes

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
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'showMaxTimeMSWarning'>
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
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'showMaxTimeMSWarning'>,
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

export function isQueryValid(fields: QueryFormFields) {
  return QUERY_PROPERTIES.every((prop) => {
    return fields[prop].valid;
  });
}

function isQueryProperty(field: string): field is QueryProperty {
  return (QUERY_PROPERTIES as readonly string[]).includes(field);
}

export function validateField(
  field: string,
  value: string,
  {
    maxTimeMS: preferencesMaxTimeMS,
    showMaxTimeMSWarning,
  }: Pick<UserPreferences, 'maxTimeMS' | 'showMaxTimeMSWarning'>
) {
  const validated = validate(field, value);
  if (field === 'filter' && validated === '') {
    // TODO(COMPASS-5205): Things like { i: $} confuses queryParser and
    // ultimately it sets filter to '' whereas it has to be a {} (if valid) or
    // false (if invalid). Should probably be fixed in mongodb-query-parser,
    // though.
    return false;
  }

  // Additional validation for maxTimeMS to make sure that we are not over the
  // upper bound set in preferences or Data Explorer limits
  if (field === 'maxTimeMS') {
    const maxTimeMS = Number(value);

    // When warning is enabled, enforce hard limit
    if (
      showMaxTimeMSWarning &&
      !Number.isNaN(maxTimeMS) &&
      maxTimeMS > WEB_MAX_TIME_MS_LIMIT
    ) {
      return false;
    }

    // Standard preference validation
    if (
      typeof preferencesMaxTimeMS !== 'undefined' &&
      value &&
      maxTimeMS > (preferencesMaxTimeMS ?? DEFAULT_FIELD_VALUES['maxTimeMS'])
    ) {
      return false;
    }
  }

  // We don't have a validator for indexes, but indexes share the same structure as
  // a sort document, so we're leveraging this to validate the hint field
  if (field === 'hint') {
    return validate('sort', value);
  }

  return validated;
}

export function isQueryFieldsValid(
  fields: QueryFormFields,
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'showMaxTimeMSWarning'>
) {
  return Object.entries(fields).every(
    ([key, value]) => validateField(key, value.string, preferences) !== false
  );
}

export function isEqualDefaultQuery(fields: QueryFormFields): boolean {
  return isEqual(mapFormFieldsToQuery(fields), DEFAULT_QUERY_VALUES);
}
