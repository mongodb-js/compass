import { isObject } from 'lodash';
import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';
import type { UserPreferences } from 'compass-preferences-model';
import {
  DEFAULT_FIELD_VALUES,
  DEFAULT_QUERY_VALUES,
} from '../constants/query-bar-store';
import type { QueryFormFields } from '../constants/query-properties';
import { QUERY_PROPERTIES } from '../constants/query-properties';

const ALLOWED_SORT_VALUES = [1, -1, 'asc', 'desc'];

function isEmpty(input: unknown): boolean {
  if (input === null || input === undefined) {
    return true;
  }
  if (typeof input === 'string') {
    const value = input.trim();
    return value === '' || value === '{}';
  }
  return Array.isArray(input) && input.length === 0;
}

function isNumberValid(input: string | number) {
  if (isEmpty(input)) {
    return 0;
  }
  return /^\d+$/.test(String(input)) ? parseInt(String(input), 10) : false;
}

function isFilterValid(input: string) {
  if (isEmpty(input)) {
    return DEFAULT_QUERY_VALUES.filter;
  }
  try {
    return parse(input, {
      mode: ParseMode.Loose,
      allowMethods: true,
    });
  } catch {
    return false;
  }
}

function isProjectValid(input: string) {
  if (isEmpty(input)) {
    return DEFAULT_QUERY_VALUES.project;
  }
  try {
    const parsed = parse(input, { mode: ParseMode.Loose });
    return isObject(parsed) && !Array.isArray(parsed) ? parsed : false;
  } catch {
    return false;
  }
}

function isSortValid(input: string) {
  if (isEmpty(input)) {
    return DEFAULT_QUERY_VALUES.sort;
  }
  try {
    const value = parse(input, {
      mode: ParseMode.Loose,
    });
    if (value === '') {
      return null;
    }
    if (Array.isArray(value)) {
      const isValid = value.every(
        (entry) =>
          Array.isArray(entry) &&
          entry.length === 2 &&
          typeof entry[0] === 'string' &&
          isValidSortDirection(entry[1])
      );
      return isValid ? value : false;
    }

    if (!isObject(value)) {
      return false;
    }

    const isValid = Object.values(value).every(isValidSortDirection);
    return isValid ? value : false;
  } catch {
    return false;
  }
}

function isValidSortDirection(direction: any) {
  return (
    ALLOWED_SORT_VALUES.includes(direction) ||
    (isObject(direction) &&
      '$meta' in direction &&
      Boolean((direction as { $meta?: unknown }).$meta))
  );
}

function isCollationValid(input: string) {
  if (isEmpty(input)) {
    return DEFAULT_QUERY_VALUES.collation;
  }
  try {
    const parsed = parse(input, { mode: ParseMode.Loose });
    return isObject(parsed) ? parsed : false;
  } catch {
    return false;
  }
}

function isHintValid(input: string) {
  if (isEmpty(input)) {
    return DEFAULT_QUERY_VALUES.hint;
  }
  try {
    const parsed = parse(input, { mode: ParseMode.Loose });
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (Array.isArray(parsed) || !isObject(parsed)) {
      return false;
    }
    return parsed;
  } catch {
    return false;
  }
}

function isSkipValid(input: string | number): number | false {
  if (isEmpty(input)) {
    return DEFAULT_QUERY_VALUES.skip;
  }
  return isNumberValid(input);
}

function isLimitValid(input: string | number): number | false {
  if (isEmpty(input)) {
    return DEFAULT_QUERY_VALUES.limit;
  }
  return isNumberValid(input);
}

function isMaxTimeMSValid(input: string | number): number | false {
  if (isEmpty(input)) {
    return DEFAULT_QUERY_VALUES.maxTimeMS;
  }
  return isNumberValid(input);
}

function validate(what: string, input: string) {
  switch (what) {
    case 'filter':
      return isFilterValid(input);
    case 'project':
      return isProjectValid(input);
    case 'sort':
      return isSortValid(input);
    case 'collation':
      return isCollationValid(input);
    case 'hint':
      return isHintValid(input);
    case 'skip':
      return isSkipValid(input);
    case 'limit':
      return isLimitValid(input);
    case 'maxTimeMS':
      return isMaxTimeMSValid(input);
    default:
      return false;
  }
}

export function validateField(
  field: string,
  value: string,
  {
    maxTimeMS: preferencesMaxTimeMS,
    maxTimeMSEnvLimit,
  }: Pick<UserPreferences, 'maxTimeMS' | 'maxTimeMSEnvLimit'>
) {
  const validated = validate(field, value);
  if ((field === 'filter' || field === 'hint') && validated === '') {
    return false;
  }

  if (field === 'maxTimeMS') {
    const maxTimeMS = Number(value);

    if (
      maxTimeMSEnvLimit &&
      !Number.isNaN(maxTimeMS) &&
      maxTimeMS > maxTimeMSEnvLimit
    ) {
      return false;
    }

    if (
      typeof preferencesMaxTimeMS !== 'undefined' &&
      value &&
      maxTimeMS > (preferencesMaxTimeMS ?? DEFAULT_FIELD_VALUES.maxTimeMS)
    ) {
      return false;
    }
  }

  return validated;
}

export function isQueryValid(fields: QueryFormFields) {
  return QUERY_PROPERTIES.every((property) => fields[property].valid);
}

export function isQueryFieldsValid(
  fields: QueryFormFields,
  preferences: Pick<UserPreferences, 'maxTimeMS' | 'maxTimeMSEnvLimit'>
) {
  return Object.entries(fields).every(
    ([key, field]) => validateField(key, field.string, preferences) !== false
  );
}
