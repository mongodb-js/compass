import type { Schema } from 'mongodb-schema';
import type {
  ArraySchemaType,
  DocumentSchemaType,
  PrimitiveSchemaType,
  SchemaField,
  SchemaType,
} from 'mongodb-schema/lib/stream';
import _ from 'lodash';

type Settings = { maxValues: number };

export function exportCompassInternalSchema(
  schema: Schema,
  settings: Settings
): Schema {
  const { maxValues } = settings;
  function slicePrimitiveSchemaType(
    type: PrimitiveSchemaType
  ): PrimitiveSchemaType {
    return {
      ...type,
      values:
        maxValues === 0
          ? (undefined as any)
          : _.uniq(type.values.slice(0, maxValues)),
    };
  }

  function sliceArraySchemaType(type: ArraySchemaType): ArraySchemaType {
    const slicedTypes = type.types.map(sliceSchemaType);
    const slicedLengths = _.uniq(type.lengths.slice(0, maxValues));
    return {
      ...type,
      types: slicedTypes,
      lengths: maxValues === 0 ? (undefined as any) : slicedLengths,
    };
  }

  function sliceDocumentSchemaType(
    type: DocumentSchemaType
  ): DocumentSchemaType {
    const slicedFields = type.fields.map(sliceSchemaField);
    return {
      ...type,
      fields: slicedFields,
    };
  }

  function sliceSchemaType(type: SchemaType): SchemaType {
    switch (type.name) {
      case 'Null':
      case 'Undefined':
        return type;
      case 'Array':
        return sliceArraySchemaType(type);
      case 'Document':
        return sliceDocumentSchemaType(type);
      default:
        return slicePrimitiveSchemaType(type);
    }
  }

  function sliceSchemaField(field: SchemaField): SchemaField {
    const slicedTypes = field.types.map(sliceSchemaType);
    return {
      ...field,
      types: slicedTypes,
    };
  }

  const slicedFields = schema.fields.map(sliceSchemaField);
  return {
    ...schema,
    fields: slicedFields,
  };
}
