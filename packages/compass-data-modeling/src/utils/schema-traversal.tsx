import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { FieldPath } from '../services/data-model-storage';

/**
 * Traverses a MongoDB JSON schema and calls the visitor for each field.
 */
export const traverseSchema = ({
  jsonSchema,
  visitor,
  parentFieldPath = [],
}: {
  jsonSchema: MongoDBJSONSchema;
  visitor: ({
    fieldPath,
    fieldTypes,
  }: {
    fieldPath: FieldPath;
    fieldTypes: string[];
    fieldSchema: MongoDBJSONSchema;
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
      fieldSchema: field,
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
    return;
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
  // Continue searching in the next step
  return getFieldFromSchema({
    jsonSchema: nextStep,
    fieldPath: remainingFieldPath,
    parentFieldPath: [...parentFieldPath, nextInPath],
  });
};

type MutationParameters = {
  update: 'removeField' | 'renameField';
  newFieldName?: string;
};

const getMutatedSchema = ({
  schema,
  fieldName,
  newFieldName,
  update,
}: {
  schema: MongoDBJSONSchema;
  fieldName: string;
} & MutationParameters): MongoDBJSONSchema => {
  switch (update) {
    case 'removeField': {
      if (!schema.properties || !schema.properties[fieldName])
        throw new Error('Field to remove does not exist');
      return {
        ...schema,
        properties: Object.fromEntries(
          Object.entries(schema.properties).filter(([key]) => key !== fieldName)
        ),
      };
    }
    case 'renameField': {
      if (!schema.properties || !schema.properties[fieldName])
        throw new Error('Field to rename does not exist');
      if (!newFieldName)
        throw new Error('New field name is required for the rename operation');
      return {
        ...schema,
        properties: Object.fromEntries(
          Object.entries(schema.properties).map(([key, value]) =>
            key === fieldName ? [newFieldName, value] : [key, value]
          )
        ),
      };
    }
    default:
      return schema;
  }
};

/**
 * Finds a single field in a MongoDB JSON schema and performs an update operation on it.
 */
export const updateSchema = ({
  jsonSchema,
  fieldPath,
  update,
  newFieldName,
}: {
  jsonSchema: MongoDBJSONSchema;
  fieldPath: FieldPath;
} & MutationParameters): MongoDBJSONSchema => {
  const newSchema = {
    ...jsonSchema,
  };
  const nextInPath = fieldPath[0];
  const remainingFieldPath = fieldPath.slice(1);
  const targetReached = remainingFieldPath.length === 0;
  if (newSchema.properties && newSchema.properties[nextInPath]) {
    if (targetReached) {
      // reached the field to remove
      return getMutatedSchema({
        schema: newSchema,
        fieldName: nextInPath,
        update,
        newFieldName,
      });
    }
    newSchema.properties = {
      ...newSchema.properties,
      [nextInPath]: updateSchema({
        jsonSchema: newSchema.properties[nextInPath],
        fieldPath: remainingFieldPath,
        update,
        newFieldName,
      }),
    };
  }
  if (newSchema.anyOf) {
    newSchema.anyOf = newSchema.anyOf.map((variant) =>
      updateSchema({
        jsonSchema: variant,
        fieldPath: fieldPath,
        update,
        newFieldName,
      })
    );
  }
  if (newSchema.items) {
    if (!Array.isArray(newSchema.items)) {
      newSchema.items = updateSchema({
        jsonSchema: newSchema.items,
        fieldPath: fieldPath,
        update,
        newFieldName,
      });
    } else {
      newSchema.items = newSchema.items.map((item) =>
        updateSchema({
          jsonSchema: item,
          fieldPath: fieldPath,
          update,
          newFieldName,
        })
      );
    }
  }

  return newSchema;
};
