import type { JSONSchema } from 'mongodb-schema';
import type { FieldPath, FieldData } from '../services/data-model-storage';

/**
 * Traverses a MongoDB JSON schema and calls the visitor for each field.
 */
export const traverseSchema = ({
  jsonSchema,
  visitor,
  parentFieldPath = [],
}: {
  jsonSchema: FieldData;
  visitor: ({
    fieldPath,
    fieldTypes,
  }: {
    fieldPath: FieldPath;
    fieldTypes: string[];
    fieldSchema: FieldData;
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
    const children: (FieldData | FieldData[])[] = [];
    if (field.bsonType) {
      types.push(field.bsonType);
    }
    if (field.properties) {
      children.push(field);
    }
    if (field.items) {
      children.push((field.items as FieldData).anyOf || field.items);
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
  items: FieldData['items'],
  child: string
): FieldData | undefined {
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

function getFieldTypes(jsonSchema: FieldData): string[] {
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
export function getFieldFromSchema({
  jsonSchema,
  fieldPath,
  parentFieldPath = [],
}: {
  jsonSchema: FieldData;
  fieldPath: FieldPath;
  parentFieldPath?: FieldPath;
}):
  | {
      fieldTypes: string[];
      jsonSchema: FieldData;
    }
  | undefined {
  const nextInPath = fieldPath[0];
  const remainingFieldPath = fieldPath.slice(1);
  let nextStep: FieldData | undefined;
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
}

type NewFieldOperationParameters = {
  update: 'addField';
  fieldName?: never;
  newFieldName: string;
  newFieldSchema: FieldData;
};

type ExistingFieldOperationParameters =
  | {
      update: 'removeField';
      newFieldName?: never;
      newFieldSchema?: never;
    }
  | {
      update: 'renameField';
      newFieldName: string;
      newFieldSchema?: never;
    }
  | {
      update: 'changeFieldSchema';
      newFieldName?: never;
      newFieldSchema: FieldData;
    };

type UpdateOperationParameters =
  | NewFieldOperationParameters
  | ExistingFieldOperationParameters;

type BulkUpdateOperationParameters = {
  updateFn: ({
    fieldSchema,
    fieldPath,
  }: {
    fieldSchema: FieldData;
    fieldPath: FieldPath;
  }) => FieldData;
};
/**
 * Adds a new field to a MongoDB JSON schema.
 * @returns the updated schema
 */
function addFieldToSchema({
  schema,
  newFieldName,
  newFieldSchema,
}: {
  schema: FieldData;
  newFieldName: string;
  newFieldSchema: FieldData;
}): FieldData {
  const newSchema = { ...schema };
  if (schema.properties) {
    newSchema.properties = {
      ...schema.properties,
      [newFieldName]: newFieldSchema,
    };
  } else if (schema.anyOf) {
    newSchema.anyOf = addFieldToAnyOf({
      anyOf: schema.anyOf,
      newFieldName,
      newFieldSchema,
    });
  } else if (schema.items) {
    newSchema.items = addFieldToItems({
      items: schema.items,
      newFieldName,
      newFieldSchema,
    });
  }
  return newSchema;
}

/**
 * Adds a new field to the first object variant in an anyOf array, or creates a new object variant if none exist.
 * @returns The updated anyOf array.
 */
function addFieldToAnyOf({
  anyOf,
  newFieldName,
  newFieldSchema,
}: {
  anyOf: NonNullable<FieldData['anyOf']>;
  newFieldName: string;
  newFieldSchema: FieldData;
}) {
  let objectFound = false;
  const newAnyOf = anyOf.map((variant) => {
    // we add the field to the first object variant we find
    if (!objectFound && variant.bsonType === 'object') {
      objectFound = true;
      return applySchemaUpdate({
        schema: variant,
        newFieldName,
        newFieldSchema,
        update: 'addField',
      });
    }
    return variant;
  });
  if (!objectFound) {
    // no object variant found, we search for adding a new one
    newAnyOf.push({
      bsonType: 'object',
      properties: {
        [newFieldName]: newFieldSchema,
      },
    });
  }
  return newAnyOf;
}

/**
 * For a tuple, adds a new field to the first object variant in items, or creates a new object variant if none exist.
 * For a single items schema (mixed or not), adds the new field to it.
 * @returns The updated items array.
 */
function addFieldToItems({
  items,
  newFieldName,
  newFieldSchema,
}: {
  items: NonNullable<FieldData['items']>;
  newFieldName: string;
  newFieldSchema: FieldData;
}) {
  if (!Array.isArray(items)) {
    return addFieldToSchema({
      schema: items,
      newFieldName,
      newFieldSchema,
    });
  }
  let objectFound = false;
  const newItems = items.map((item) => {
    // we add the field to the first object variant we find
    if (!objectFound && item.bsonType === 'object') {
      objectFound = true;
      return applySchemaUpdate({
        schema: item,
        newFieldName,
        newFieldSchema,
        update: 'addField',
      });
    }
    return item;
  });
  if (!objectFound) {
    // no object variant found, we add a new one
    newItems.push({
      bsonType: 'object',
      properties: {
        [newFieldName]: newFieldSchema,
      },
    });
  }

  return newItems;
}

/**
 * Performs a schema update operation on MongoDB JSON schema.
 * @returns the updated schema
 */
function applySchemaUpdate({
  schema,
  fieldName,
  newFieldName,
  newFieldSchema,
  update,
}: {
  schema: FieldData;
} & (
  | NewFieldOperationParameters
  | (ExistingFieldOperationParameters & { fieldName: string })
)): FieldData {
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
      return addFieldToSchema({
        schema,
        newFieldName,
        newFieldSchema,
      });
    }
    default:
      return schema;
  }
}

function isNewFieldOperation(
  params: Omit<UpdateOperationParameters, 'fieldName'>
): params is NewFieldOperationParameters {
  return params.update === 'addField';
}

function isExistingFieldOperation(
  params: Omit<UpdateOperationParameters, 'fieldName'>
): params is ExistingFieldOperationParameters {
  return params.update !== 'addField';
}

/**
 * Performs an update operation on all fields in a MongoDB JSON schema.
 */
export function bulkUpdateSchema({
  jsonSchema,
  updateParameters,
  parentPath = [],
}: {
  jsonSchema: FieldData;
  updateParameters: BulkUpdateOperationParameters;
  parentPath?: FieldPath;
}): FieldData {
  const newSchema = {
    ...jsonSchema,
  };
  if (newSchema.properties) {
    newSchema.properties = Object.fromEntries(
      Object.entries(newSchema.properties).map(([fieldName, fieldSchema]) => [
        fieldName,
        bulkUpdateSchema({
          jsonSchema: updateParameters.updateFn({
            fieldSchema: fieldSchema as FieldData,
            fieldPath: [...parentPath, fieldName],
          }),
          parentPath: [...parentPath, fieldName],
          updateParameters,
        }),
      ])
    );
  }
  if (newSchema.anyOf) {
    newSchema.anyOf = newSchema.anyOf.map((variant) =>
      bulkUpdateSchema({
        jsonSchema: variant,
        parentPath,
        updateParameters,
      })
    );
  }
  if (newSchema.items) {
    if (!Array.isArray(newSchema.items)) {
      newSchema.items = bulkUpdateSchema({
        jsonSchema: newSchema.items,
        parentPath,
        updateParameters,
      });
    } else {
      newSchema.items = newSchema.items.map((item) =>
        bulkUpdateSchema({
          jsonSchema: item,
          parentPath,
          updateParameters,
        })
      );
    }
  }

  return newSchema;
}

/**
 * Finds a single field in a MongoDB JSON schema and performs an update operation on it.
 */
export function updateSchema({
  jsonSchema,
  fieldPath,
  updateParameters,
}: {
  jsonSchema: FieldData;
  fieldPath: FieldPath;
  updateParameters: Omit<UpdateOperationParameters, 'fieldName'>;
}): FieldData {
  const newSchema = {
    ...jsonSchema,
  };
  if (fieldPath.length === 0 && isNewFieldOperation(updateParameters)) {
    return applySchemaUpdate({
      schema: newSchema,
      ...updateParameters,
    });
  }
  const nextInPath = fieldPath[0];
  const remainingFieldPath = fieldPath.slice(1);
  const targetReached = remainingFieldPath.length === 0;
  if (newSchema.properties && newSchema.properties[nextInPath]) {
    if (targetReached && isExistingFieldOperation(updateParameters)) {
      // reached the field to update
      return applySchemaUpdate({
        schema: newSchema,
        fieldName: nextInPath,
        ...updateParameters,
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

  return newSchema;
}

const getMin1ArrayVariants = (oldSchema: JSONSchema) => {
  const arrayVariants = oldSchema.anyOf?.filter(
    (variant) => variant.bsonType === 'array'
  );
  if (arrayVariants && arrayVariants.length > 0) {
    return arrayVariants as [FieldData, ...FieldData[]];
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
): [FieldData, ...FieldData[]] => {
  const objectVariants = oldSchema.anyOf?.filter(
    (variant) => variant.bsonType === 'object'
  );
  if (objectVariants && objectVariants.length > 0) {
    return objectVariants as [FieldData, ...FieldData[]];
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
  oldSchema: FieldData,
  newTypes: string[]
): FieldData[] => {
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
  oldSchema: FieldData,
  newTypes: string[]
): FieldData {
  const oldTypes = getFieldTypes(oldSchema);
  if (oldTypes.join(',') === newTypes.join(',')) return oldSchema;

  // Simple schema - new type does includes neither object nor array
  if (!newTypes.some((t) => t === 'object' || t === 'array')) {
    return { bsonType: newTypes };
  }

  // Complex schema
  const arrayVariants: FieldData[] = newTypes.includes('array')
    ? getMin1ArrayVariants(oldSchema)
    : [];
  const objectVariants: FieldData[] = newTypes.includes('object')
    ? getMin1ObjectVariants(oldSchema)
    : [];
  const otherVariants: FieldData[] = getOtherVariants(oldSchema, newTypes);

  const newVariants = [...arrayVariants, ...objectVariants, ...otherVariants];
  if (newVariants.length === 1) {
    return newVariants[0];
  }
  return { anyOf: newVariants };
}

/**
 * Gets the direct children of a MongoDB JSON schema.
 * @param field - field to get direct children for
 * @returns direct children of the field (if any)
 */
export function* getDirectChildren(
  schema: FieldData
): Iterable<[string, FieldData]> {
  // children are either direct (properties), from anyOf, items or items.anyOf
  if (schema.properties) {
    yield* Object.entries(schema.properties);
  }
  if (schema.items) {
    if (!Array.isArray(schema.items)) {
      yield* getDirectChildren(schema.items);
    } else {
      for (const item of schema.items) {
        yield* getDirectChildren(item);
      }
    }
  }
  if (schema.anyOf) {
    for (const variant of schema.anyOf) {
      yield* getDirectChildren(variant);
    }
  }
}
