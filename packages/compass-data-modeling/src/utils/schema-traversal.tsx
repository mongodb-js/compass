import type { JSONSchema, MongoDBJSONSchema } from 'mongodb-schema';
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

function getFieldTypes(jsonSchema: MongoDBJSONSchema): string[] {
  const types: string[] = [];
  if (jsonSchema.bsonType) {
    if (Array.isArray(jsonSchema.bsonType)) {
      types.push(...jsonSchema.bsonType);
    } else {
      types.push(jsonSchema.bsonType);
    }
  }
  if (jsonSchema.anyOf) {
    types.push(
      ...jsonSchema.anyOf.flatMap((variant) => variant.bsonType || [])
    );
  }
  return types;
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
    return {
      fieldTypes: getFieldTypes(nextStep),
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

type UpdateOperationParameters =
  | {
      update: 'removeField';
      fieldName: string;
      newFieldName?: never;
      newFieldSchema?: never;
    }
  | {
      update: 'renameField';
      fieldName: string;
      newFieldName: string;
      newFieldSchema?: never;
    }
  | {
      update: 'addField';
      fieldName?: never;
      newFieldName: string;
      newFieldSchema: MongoDBJSONSchema;
    }
  | {
      update: 'changeFieldSchema';
      fieldName: string;
      newFieldName?: never;
      newFieldSchema: MongoDBJSONSchema;
    };

const applySchemaUpdate = ({
  schema,
  fieldName,
  newFieldName,
  newFieldSchema,
  update,
}: {
  schema: MongoDBJSONSchema;
} & UpdateOperationParameters): MongoDBJSONSchema => {
  switch (update) {
    case 'removeField': {
      if (!schema.properties || !schema.properties[fieldName])
        throw new Error('Field to remove does not exist');
      const newSchema = {
        ...schema,
        properties: Object.fromEntries(
          Object.entries(schema.properties).filter(([key]) => key !== fieldName)
        ),
      };
      // clean up required if needed
      if (newSchema.required && Array.isArray(newSchema.required)) {
        newSchema.required = newSchema.required.filter(
          (key) => key !== fieldName
        );
      }
      return newSchema;
    }
    case 'renameField': {
      if (!schema.properties || !schema.properties[fieldName])
        throw new Error('Field to rename does not exist');
      if (!newFieldName)
        throw new Error('New field name is required for the rename operation');
      const newSchema = {
        ...schema,
        properties: Object.fromEntries(
          Object.entries(schema.properties).map(([key, value]) =>
            key === fieldName ? [newFieldName, value] : [key, value]
          )
        ),
      };
      // update required if needed
      if (newSchema.required && Array.isArray(newSchema.required)) {
        newSchema.required = newSchema.required.map((key) =>
          key !== fieldName ? key : newFieldName
        );
      }
      return newSchema;
    }
    case 'changeFieldSchema': {
      if (!schema.properties || !schema.properties[fieldName])
        throw new Error('Field to change type does not exist');
      if (!newFieldSchema)
        throw new Error(
          'New field schema is required for the change operation'
        );
      return {
        ...schema,
        properties: {
          ...schema.properties,
          [fieldName]: newFieldSchema,
        },
      };
    }
    case 'addField': {
      if (!newFieldSchema)
        throw new Error('New field schema is required for the add operation');
      if (!newFieldName)
        throw new Error('New field name is required for the add operation');
      const newSchema = {
        ...schema,
        properties: {
          ...schema.properties,
          [newFieldName]: newFieldSchema,
        },
      };
      console.log('Added field, new schema:', schema, newSchema);
      return newSchema;
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
  updateParameters,
}: {
  jsonSchema: MongoDBJSONSchema;
  fieldPath: FieldPath;
  updateParameters: Omit<UpdateOperationParameters, 'fieldName'>;
}): MongoDBJSONSchema => {
  console.log('UpdateSchema', fieldPath, updateParameters, jsonSchema);
  const newSchema = {
    ...jsonSchema,
  };
  if (fieldPath.length === 0 && updateParameters.update === 'addField') {
    return applySchemaUpdate({
      schema: newSchema,
      ...updateParameters,
      update: 'addField',
    });
  }
  const nextInPath = fieldPath[0];
  const remainingFieldPath = fieldPath.slice(1);
  const targetReached = remainingFieldPath.length === 0;
  if (newSchema.properties && newSchema.properties[nextInPath]) {
    if (targetReached && updateParameters.update !== 'addField') {
      // reached the field to remove
      return applySchemaUpdate({
        schema: newSchema,
        ...updateParameters,
        fieldName: nextInPath,
      });
    }
    newSchema.properties = {
      ...newSchema.properties,
      [nextInPath]: updateSchema({
        jsonSchema: newSchema.properties[nextInPath],
        fieldPath: remainingFieldPath,
        updateParameters,
      }),
    };
  }
  if (newSchema.anyOf) {
    newSchema.anyOf = newSchema.anyOf.map((variant) =>
      updateSchema({
        jsonSchema: variant,
        fieldPath: fieldPath,
        updateParameters,
      })
    );
  }
  if (newSchema.items) {
    if (!Array.isArray(newSchema.items)) {
      newSchema.items = updateSchema({
        jsonSchema: newSchema.items,
        fieldPath: fieldPath,
        updateParameters,
      });
    } else {
      newSchema.items = newSchema.items.map((item) =>
        updateSchema({
          jsonSchema: item,
          fieldPath: fieldPath,
          updateParameters,
        })
      );
    }
  }

  console.log('Done', updateParameters, fieldPath, jsonSchema, newSchema);
  return newSchema;
};

const getMin1ArrayVariants = (oldSchema: JSONSchema) => {
  const arrayVariants = oldSchema.anyOf?.filter(
    (variant) => variant.bsonType === 'array'
  );
  if (arrayVariants && arrayVariants.length > 0) {
    return arrayVariants as [MongoDBJSONSchema, ...MongoDBJSONSchema[]];
  }
  return [
    {
      bsonType: 'array',
      items: oldSchema.items || {},
    },
  ];
};

const getMin1ObjectVariants = (
  oldSchema: JSONSchema
): [MongoDBJSONSchema, ...MongoDBJSONSchema[]] => {
  const objectVariants = oldSchema.anyOf?.filter(
    (variant) => variant.bsonType === 'object'
  );
  if (objectVariants && objectVariants.length > 0) {
    return objectVariants as [MongoDBJSONSchema, ...MongoDBJSONSchema[]];
  }
  return [
    {
      bsonType: 'object',
      properties: oldSchema.properties || {},
      required: oldSchema.required || [],
    },
  ];
};

const getOtherVariants = (
  oldSchema: MongoDBJSONSchema,
  newTypes: string[]
): MongoDBJSONSchema[] => {
  const existingAnyOfVariants =
    oldSchema.anyOf?.filter(
      (variant) =>
        typeof variant.bsonType === 'string' &&
        variant.bsonType !== 'object' &&
        variant.bsonType !== 'array' &&
        newTypes.includes(variant.bsonType)
    ) || [];
  const existingAnyOfTypes = existingAnyOfVariants
    .map((v) => v.bsonType)
    .flat();
  const existingBasicTypes = oldSchema.bsonType
    ? Array.isArray(oldSchema.bsonType)
      ? oldSchema.bsonType
      : [oldSchema.bsonType]
    : [];
  const existingBasicVariants = existingBasicTypes
    .filter(
      (type) => type !== 'object' && type !== 'array' && newTypes.includes(type)
    )
    .map((type) => ({ bsonType: type }));
  const newVariants = newTypes
    .filter(
      (type) =>
        type !== 'object' &&
        type !== 'array' &&
        !existingAnyOfTypes.includes(type) &&
        !existingBasicTypes.includes(type)
    )
    .map((type) => ({ bsonType: type }));
  return [...existingAnyOfVariants, ...existingBasicVariants, ...newVariants];
};

export function getSchemaWithNewTypes(
  oldSchema: MongoDBJSONSchema,
  newTypes: string[]
): MongoDBJSONSchema {
  const oldTypes = getFieldTypes(oldSchema);
  if (oldTypes.join(',') === newTypes.join(',')) return oldSchema;

  // Simple schema - new type does includes neither object nor array
  if (!newTypes.some((t) => t === 'object' || t === 'array')) {
    return { bsonType: newTypes };
  }

  // Complex schema
  const arrayVariants: MongoDBJSONSchema[] = newTypes.includes('array')
    ? getMin1ArrayVariants(oldSchema)
    : [];
  const objectVariants: MongoDBJSONSchema[] = newTypes.includes('object')
    ? getMin1ObjectVariants(oldSchema)
    : [];
  const otherVariants: MongoDBJSONSchema[] = getOtherVariants(
    oldSchema,
    newTypes
  );

  const newVariants = [...arrayVariants, ...objectVariants, ...otherVariants];
  if (newVariants.length === 1) {
    return newVariants[0];
  }
  return { anyOf: newVariants };
}
