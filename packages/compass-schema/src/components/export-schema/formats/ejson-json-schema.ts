import type {
  Schema,
  SchemaField,
  SchemaType,
} from 'mongodb-schema/lib/stream';

export const CANONICAL = Object.freeze({
  ObjectId: {
    type: 'object',
    properties: {
      $oid: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
      },
    },
    required: ['$oid'],
    additionalProperties: false,
  },
  BSONSymbol: {
    type: 'object',
    properties: {
      $symbol: {
        type: 'string',
      },
    },
    required: ['$symbol'],
    additionalProperties: false,
  },
  Int32: {
    type: 'object',
    properties: {
      $numberInt: {
        type: 'string',
        pattern: '^-?[0-9]{1,10}$',
      },
    },
    required: ['$numberInt'],
    additionalProperties: false,
  },
  Long: {
    type: 'object',
    properties: {
      $numberLong: {
        type: 'string',
        pattern: '^-?[0-9]{1,19}$',
      },
    },
    required: ['$numberLong'],
    additionalProperties: false,
  },
  Double: {
    type: 'object',
    properties: {
      $numberDouble: {
        oneOf: [
          {
            type: 'string',
            pattern: '^(?:-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)$',
          },
          {
            type: 'string',
            enum: ['Infinity', '-Infinity', 'NaN'],
          },
        ],
      },
    },
    required: ['$numberDouble'],
    additionalProperties: false,
  },
  Decimal128: {
    type: 'object',
    properties: {
      $numberDecimal: {
        type: 'string',
      },
    },
    required: ['$numberDecimal'],
    additionalProperties: false,
  },
  Binary: {
    type: 'object',
    properties: {
      $binary: {
        type: 'object',
        properties: {
          base64: {
            type: 'string',
          },
          subType: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{2}$',
          },
        },
        required: ['base64', 'subType'],
        additionalProperties: false,
      },
    },
    required: ['$binary'],
    additionalProperties: false,
  },
  Code: {
    type: 'object',
    properties: {
      $code: {
        type: 'string',
      },
    },
    required: ['$code'],
    additionalProperties: false,
  },
  Timestamp: {
    type: 'object',
    properties: {
      $timestamp: {
        type: 'object',
        properties: {
          t: {
            type: 'integer',
            minimum: 0,
            maximum: 4294967295,
          },
          i: {
            type: 'integer',
            minimum: 0,
            maximum: 4294967295,
          },
        },
        required: ['t', 'i'],
        additionalProperties: false,
      },
    },
    required: ['$timestamp'],
    additionalProperties: false,
  },
  RegExp: {
    type: 'object',
    properties: {
      $regularExpression: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
          },
          options: {
            type: 'string',
            pattern: '^[gimuy]*$',
          },
        },
        required: ['pattern'],
        additionalProperties: false,
      },
    },
    required: ['$regularExpression'],
    additionalProperties: false,
  },
  DBPointer: {
    type: 'object',
    properties: {
      $dbPointer: {
        type: 'object',
        properties: {
          $ref: {
            type: 'string',
          },
          $id: {
            type: 'object',
          },
        },
        required: ['$ref', '$id'],
        additionalProperties: false,
      },
    },
    required: ['$dbPointer'],
    additionalProperties: false,
  },
  Date: {
    type: 'object',
    properties: {
      $date: {
        type: 'object',
        properties: {
          $numberLong: {
            type: 'string',
            pattern: '^-?[0-9]{1,19}$',
          },
        },
        required: ['$numberLong'],
        additionalProperties: false,
      },
    },
    required: ['$date'],
    additionalProperties: false,
  },
  DBRef: {
    type: 'object',
    properties: {
      $ref: {
        type: 'string',
      },
      $id: {},
      $db: {
        type: 'string',
      },
    },
    required: ['$ref', '$id'],
    additionalProperties: true,
  },
  MinKey: {
    type: 'object',
    properties: {
      $minKey: {
        type: 'integer',
        const: 1,
      },
    },
    required: ['$minKey'],
    additionalProperties: false,
  },
  MaxKey: {
    type: 'object',
    properties: {
      $maxKey: {
        type: 'integer',
        const: 1,
      },
    },
    required: ['$maxKey'],
    additionalProperties: false,
  },
  Undefined: {
    type: 'object',
    properties: {
      $undefined: {
        type: 'boolean',
        const: true,
      },
    },
    required: ['$undefined'],
    additionalProperties: false,
  },
});

export const RELAXED = Object.freeze({
  ...CANONICAL,
  Int32: {
    type: 'integer',
  },
  Long: {
    type: 'integer',
  },
  Double: {
    oneOf: [
      { type: 'number' },
      {
        enum: ['Infinity', '-Infinity', 'NaN'],
      },
    ],
  },
  Date: {
    type: 'object',
    properties: {
      $date: {
        type: 'string',
        format: 'date-time',
      },
    },
    required: ['$date'],
    additionalProperties: false,
  },
});

type SimpleSchemaType =
  | Exclude<SchemaType['name'], 'Symbol' | 'Number' | 'Array' | 'Document'>
  | 'Double'
  | 'BSONSymbol';

export function exportJSONSchema(
  schema: Schema,
  settings: {
    includeId: boolean;
    requireMandatoryProperties: boolean;
    additionalProperties: boolean;
    relaxed: boolean;
  }
): object {
  const typeToSchemaTypeMap: Record<
    SimpleSchemaType,
    { $ref: string } | { type: string }
  > = {
    Double: { $ref: '#/$defs/Double' },
    String: { type: 'string' },
    Binary: { $ref: '#/$defs/Binary' },
    Undefined: { $ref: '#/$defs/Undefined' },
    ObjectId: { $ref: '#/$defs/ObjectId' },
    Boolean: { type: 'boolean' },
    Date: { $ref: '#/$defs/Date' },
    Null: { type: 'null' },
    RegExp: { $ref: '#/$defs/RegExp' },
    DBRef: { $ref: '#/$defs/DBRef' },
    BSONSymbol: { $ref: '#/$defs/BSONSymbol' },
    Code: { $ref: '#/$defs/Code' },
    Int32: settings.relaxed ? RELAXED.Int32 : { $ref: '#/$defs/Int32' },
    Timestamp: { $ref: '#/$defs/Timestamp' },
    Long: settings.relaxed ? RELAXED.Long : { $ref: '#/$defs/Long' },
    Decimal128: { $ref: '#/$defs/Decimal128' },
    MinKey: { $ref: '#/$defs/MinKey' },
    MaxKey: { $ref: '#/$defs/MaxKey' },
  };

  function processSchemaTypes(types: SchemaType[]): object {
    // if the only type is Undefined, we use it
    if (types.length === 1) {
      return processSchemaType(types[0]);
    }

    // if there are more types we remove 'Undefined', since the "probability" of the remaining types
    // is not 1, the property will just not be 'required'.
    const typesWithoutUndefined = types.filter((t) => t.name !== 'Undefined');

    if (typesWithoutUndefined.length === 1) {
      return processSchemaType(typesWithoutUndefined[0]);
    }

    return {
      anyOf: typesWithoutUndefined.map((t) => processSchemaType(t)),
    };
  }

  function getRequiredFields(fields: SchemaField[]) {
    const required = fields
      .filter((f) => f.probability === 1)
      .map((f) => f.name);

    return required.length ? required : undefined;
  }

  function processDocumentType(fields: SchemaField[]) {
    const properties: { [key: string]: object } = {};

    for (const field of fields) {
      properties[field.name] = processSchemaTypes(field.types);
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

  const definitions: Partial<Record<SimpleSchemaType, any>> = {};

  function processSchemaType(type: SchemaType): object {
    if (type.name === 'Document') {
      return {
        type: 'object',
        ...processDocumentType(type.fields),
      };
    }

    if (type.name === 'Array') {
      return {
        type: 'array',
        items: processSchemaTypes(type.types),
      };
    }

    const simpleTypeName = type.name as SimpleSchemaType;
    const schemaType = typeToSchemaTypeMap[simpleTypeName];

    if (!schemaType) {
      throw new Error(`Unrecognized type: "${type.name}"`);
    }

    // Since we are using a type we need to add it to the definitions
    const ejsonFormat = settings.relaxed ? RELAXED : CANONICAL;
    const definition = (ejsonFormat as any)[simpleTypeName];

    if (definition) {
      definitions[simpleTypeName] = definition;
    }

    return { ...schemaType };
  }

  const fields = settings.includeId
    ? schema.fields
    : schema.fields.filter((f) => f.name !== '_id');

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...processDocumentType(fields),
    $defs: Object.keys(definitions).length ? definitions : undefined,
  };
}
