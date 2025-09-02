import {
  cloneDeep,
  isArray,
  isNumber,
  isString,
  mergeWith,
  pick,
  uniq,
} from 'lodash';
import type {
  ArraySchemaType,
  DocumentSchemaType,
  SchemaField,
  SchemaType,
} from 'mongodb-schema';

const SCHEMA_FIELD_FIELDS = ['name', 'path', 'count', 'type'] as const;

export type SchemaFieldSubset = Pick<
  SchemaField,
  (typeof SCHEMA_FIELD_FIELDS)[number]
>;

/**
 * For the field store we generate a flattened map of path strings
 * for autocompletion. We generate the path
 * id strings by joining field paths with dots, this means we can
 * have collisions when there are field names with dots in them.
 */
function getFlattenedPathIdString(path: string[]) {
  return path.join('.');
}

export function mergeFields(
  existingField: SchemaFieldSubset,
  newField: SchemaFieldSubset
) {
  return mergeWith(
    existingField,
    newField,
    function (objectValue, sourceValue, key) {
      if (key === 'count') {
        // counts add up
        return isNumber(objectValue) && isNumber(sourceValue)
          ? objectValue + sourceValue
          : sourceValue;
      }
      if (key === 'type') {
        // Avoid the merge of 'Array' with 'Array' case becoming
        // an array with a single value, i.e. ['Array']
        if (objectValue === sourceValue) {
          return objectValue;
        }
        // arrays concatenate and de-duplicate
        if (isString(objectValue)) {
          return uniq([objectValue, sourceValue]);
        }
        return isArray(objectValue)
          ? uniq(objectValue.concat(sourceValue))
          : sourceValue;
      }
      // all other keys are handled as per default
      return undefined;
    }
  );
}

export function flattenArray(
  fields: Record<string, SchemaFieldSubset>,
  nestedTypes: SchemaType[]
) {
  // Arrays have no name, so can only recurse into arrays or subdocuments
  for (const type of nestedTypes) {
    if (type.name === 'Document') {
      // recurse into nested sub-fields
      flattenFields(fields, (type as DocumentSchemaType).fields);
    }
    if (type.name === 'Array') {
      // recurse into nested arrays (again)
      flattenArray(fields, (type as ArraySchemaType).types);
    }
  }
}

export function flattenFields(
  fields: Record<string, SchemaFieldSubset>,
  nestedFields: SchemaField[]
) {
  if (!nestedFields) {
    return;
  }

  for (const field of nestedFields) {
    const fieldPathId = getFlattenedPathIdString(field.path);

    const existingField = fields[fieldPathId] || {};
    const newField = pick(field, SCHEMA_FIELD_FIELDS);

    fields[fieldPathId] = mergeFields(existingField, newField);

    // recursively search arrays and subdocuments
    for (const type of field.types) {
      if (type.name === 'Document') {
        // add nested sub-fields
        flattenFields(fields, (type as DocumentSchemaType).fields);
      }
      if (type.name === 'Array') {
        // add arrays of arrays or subdocuments
        flattenArray(fields, (type as ArraySchemaType).types);
      }
    }
  }
}

export function mergeSchema(
  fields: Record<string, SchemaFieldSubset>,
  schemaFields: SchemaField[]
): { fields: Record<string, SchemaFieldSubset>; topLevelFields: string[] } {
  fields = cloneDeep(fields);

  const topLevelFields = [];

  for (const field of schemaFields) {
    // TODO: this should be just an attribube on the schema?
    topLevelFields.push(field.name);
  }

  flattenFields(fields, schemaFields);

  return { fields, topLevelFields };
}

export function schemaFieldsToAutocompleteItems(
  fields: Record<string, SchemaFieldSubset>
) {
  function stringifyType(type: string | string[]) {
    return typeof type === 'string'
      ? type
      : // Type can be an array of arrays, values can also be duplicated between
        // arrays of types, so we pick only unique ones
        uniq(type.flat()).join(' | ');
  }

  return Object.entries(fields).map(([key, field]) => {
    return {
      name: key,
      value: key,
      score: 1,
      meta: 'field',
      version: '0.0.0',
      description: stringifyType(field.type),
    };
  });
}
