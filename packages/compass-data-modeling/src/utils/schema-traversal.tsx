import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { FieldPath } from '../services/data-model-storage';

/**
 * Traverses a MongoDB JSON schema and calls the visitor for each field.
 *
 * @param {Object} params - The parameters object.
 * @param {MongoDBJSONSchema} params.jsonSchema - The JSON schema to traverse.
 * @param {function} params.visitor - Function called for each field.
 * @returns {void}
 */
export const traverseSchema = ({
  jsonSchema,
  parentFieldPath = [],
  visitor,
}: {
  jsonSchema: MongoDBJSONSchema;
  visitor: ({
    fieldPath,
    fieldTypes,
  }: {
    fieldPath: FieldPath;
    fieldTypes: string[];
  }) => void;
  parentFieldPath?: FieldPath;
}): void => {
  if (!jsonSchema || !jsonSchema.properties) {
    return;
  }
  for (const [name, field] of Object.entries(jsonSchema.properties)) {
    // field has types, properties and (optional) children
    // types are either direct, or from anyof
    // children are either direct (properties), from anyOf, items or items.anyOf
    const types: (string | string[])[] = [];
    const children: (MongoDBJSONSchema | MongoDBJSONSchema[])[] = [];
    if (field.bsonType) {
      types.push(field.bsonType);
    }
    if (field.properties) {
      children.push(field);
    }
    if (field.items) {
      children.push((field.items as MongoDBJSONSchema).anyOf || field.items);
    }
    if (field.anyOf) {
      for (const variant of field.anyOf) {
        if (variant.bsonType) {
          types.push(variant.bsonType);
        }
        if (variant.properties) {
          children.push(variant);
        }
        if (variant.items) {
          children.push(variant.items);
        }
      }
    }

    const newFieldPath = [...parentFieldPath, name];

    visitor({
      fieldPath: newFieldPath,
      fieldTypes: types.flat(),
    });

    children.flat().forEach((child) =>
      traverseSchema({
        jsonSchema: child,
        visitor,
        parentFieldPath: newFieldPath,
      })
    );
  }
};

function searchItemsForChild(
  items: MongoDBJSONSchema['items'],
  child: string
): MongoDBJSONSchema | undefined {
  // When items is an array, this indicates multiple non-complex types
  if (!items || Array.isArray(items)) return undefined;
  // Nested array - we go deeper
  if (items.items) {
    const result = searchItemsForChild(items.items, child);
    if (result) return result;
  }
  // Array of single type and that type is an object
  if (items.properties && items.properties[child]) {
    return items.properties[child];
  }
  // Array of multiple types, possibly including objects
  if (items.anyOf) {
    for (const item of items.anyOf) {
      if (item.properties && item.properties[child]) {
        return item.properties[child];
      }
    }
  }
  return undefined;
}

/**
 * Finds a single field in a MongoDB JSON schema.
 *
 * @param {Object} params - The parameters object.
 * @param {MongoDBJSONSchema} params.jsonSchema - The JSON schema to traverse.
 * @param {FieldPath} params.fieldPath - The field path to find.
 * @returns {Object} result - The field information.
 * @returns {FieldPath[]} result.fieldPath - The full path to the found field.
 * @returns {string[]} result.fieldTypes - Flat list of BSON types for the found field.
 * @returns {MongoDBJSONSchema} result.jsonSchema - The JSON schema node for the found field.
 
 */
export const getFieldFromSchema = ({
  jsonSchema,
  fieldPath,
  parentFieldPath = [],
}: {
  jsonSchema: MongoDBJSONSchema;
  fieldPath: FieldPath;
  parentFieldPath?: FieldPath;
}):
  | {
      fieldTypes: string[];
      jsonSchema: MongoDBJSONSchema;
    }
  | undefined => {
  const nextInPath = fieldPath[0];
  const remainingFieldPath = fieldPath.slice(1);
  let nextStep: MongoDBJSONSchema | undefined;
  if (jsonSchema.properties && jsonSchema.properties[nextInPath]) {
    nextStep = jsonSchema.properties[nextInPath];
  }
  if (!nextStep && jsonSchema.items) {
    nextStep = searchItemsForChild(jsonSchema.items, nextInPath);
  }
  if (!nextStep && jsonSchema.anyOf) {
    for (const variant of jsonSchema.anyOf) {
      if (variant.properties && variant.properties[nextInPath]) {
        nextStep = variant.properties[nextInPath];
        break;
      }
      if (variant.items) {
        nextStep = searchItemsForChild(variant.items, nextInPath);
        if (nextStep) break;
      }
    }
  }
  if (!nextStep) {
    throw new Error('Field not found in schema');
  }

  // Reached the end of path, return the field information
  if (fieldPath.length === 1) {
    const types: string[] = [];
    if (nextStep.bsonType) {
      if (Array.isArray(nextStep.bsonType)) {
        types.push(...nextStep.bsonType);
      } else {
        types.push(nextStep.bsonType);
      }
    }
    if (nextStep.anyOf) {
      types.push(
        ...nextStep.anyOf.flatMap((variant) => variant.bsonType || [])
      );
    }
    return {
      fieldTypes: types,
      jsonSchema: nextStep,
    };
  }
  console.log('Search lower', {
    jsonSchema: nextStep,
    fieldPath: remainingFieldPath,
    parentFieldPath: [...parentFieldPath, nextInPath],
  });
  // Continue searching in the next step
  return getFieldFromSchema({
    jsonSchema: nextStep,
    fieldPath: remainingFieldPath,
    parentFieldPath: [...parentFieldPath, nextInPath],
  });
};
