import type { Schema } from 'mongodb-schema';
import type { SchemaField, SchemaType } from 'mongodb-schema/lib/stream';

type Settings = {
  includeId: boolean;
  requireMandatoryProperties: boolean;
  additionalProperties: boolean;
};

const typeToSchemaBsonTypeMap: Record<
  SchemaType['name'] | 'Double' | 'BSONSymbol',
  string
> = {
  Double: 'double',
  Number: 'double',
  String: 'string',
  Document: 'object',
  Array: 'array',
  Binary: 'binData',
  Undefined: 'undefined',
  ObjectId: 'objectId',
  Boolean: 'bool',
  Date: 'date',
  Null: 'null',
  RegExp: 'regex',
  DBRef: 'dbPointer',
  BSONSymbol: 'symbol',
  Symbol: 'symbol',
  Code: 'javascript',
  Int32: 'int',
  Timestamp: 'timestamp',
  Long: 'long',
  Decimal128: 'decimal',
  MinKey: 'minKey',
  MaxKey: 'maxKey',
};

function processSchemaTypes(types: SchemaType[], settings: Settings): object {
  if (types.length === 1) {
    return processSchemaType(types[0], settings);
  }

  const hasComplexTypes = types.some((type: SchemaType) =>
    ['Document', 'Array'].includes(type.name)
  );

  if (hasComplexTypes) {
    return {
      anyOf: types.map((t) => processSchemaType(t, settings)),
    };
  }

  return {
    bsonType: types.map((t) => typeToSchemaBsonTypeMap[t.name]),
  };
}

function getRequiredFields(fields: SchemaField[]) {
  const required = fields.filter((f) => f.probability === 1).map((f) => f.name);

  return required.length ? required : undefined;
}

function processDocumentType(fields: SchemaField[], settings: Settings) {
  const properties: { [key: string]: object } = {};

  for (const field of fields) {
    properties[field.name] = processSchemaTypes(field.types, settings);
  }

  return {
    properties,
    ...(settings.requireMandatoryProperties
      ? { required: getRequiredFields(fields) }
      : {}),

    ...(settings.additionalProperties === false
      ? { additionalProperties: false }
      : {}),
  };
}

function processSchemaType(type: SchemaType, settings: Settings): object {
  const schemaBsonType = typeToSchemaBsonTypeMap[type.name];

  if (!schemaBsonType) {
    throw new Error(`Unrecognized type: "${type.name}"`);
  }

  if (type.name === 'Document') {
    return {
      bsonType: schemaBsonType,
      ...processDocumentType(type.fields, settings),
    };
  }

  if (type.name === 'Array') {
    return {
      bsonType: schemaBsonType,
      items: processSchemaTypes(type.types, settings),
    };
  }

  return { bsonType: schemaBsonType };
}

export function exportMongodbJSONSchema(
  schema: Schema,
  settings: Settings
): object {
  const fields = settings.includeId
    ? schema.fields
    : schema.fields.filter((f) => f.name !== '_id');

  return {
    $jsonSchema: {
      ...processDocumentType(fields, settings),
    },
  };
}
