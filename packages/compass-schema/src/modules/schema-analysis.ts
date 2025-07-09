import type { AggregateOptions, Filter, Document } from 'mongodb';
import { analyzeDocuments } from 'mongodb-schema';
import type {
  Schema,
  SchemaAccessor,
  ArraySchemaType,
  DocumentSchemaType,
  SchemaField,
  SchemaType,
  PrimitiveSchemaType,
  SchemaParseOptions,
} from 'mongodb-schema';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';

export const DISTINCT_FIELDS_ABORT_THRESHOLD = 1000;

// hack for driver 3.6 not promoting error codes and
// attributes from ejson when promoteValue is false.
function promoteMongoErrorCode(err?: Error & { code?: unknown }) {
  if (!err) {
    return new Error('Unknown error');
  }

  if (err.name === 'MongoError' && err.code !== undefined) {
    err.code = JSON.parse(JSON.stringify(err.code));
  }

  return err;
}

export const analyzeSchema = async (
  dataService: Pick<DataService, 'sampleCursor'>,
  abortSignal: AbortSignal,
  ns: string,
  query:
    | {
        query?: Filter<Document>;
        size?: number;
        fields?: Document;
      }
    | undefined,
  aggregateOptions: AggregateOptions,
  { log, mongoLogId, debug }: Logger,
  preferences: PreferencesAccess
): Promise<SchemaAccessor | undefined> => {
  try {
    log.info(mongoLogId(1001000089), 'Schema', 'Starting schema analysis', {
      ns,
    });

    const sampleCursor = dataService.sampleCursor(
      ns,
      query,
      {
        ...aggregateOptions,
        promoteValues: false,
        signal: abortSignal,
      },
      {
        fallbackReadPreference: 'secondaryPreferred',
      }
    );
    const { enableExportSchema } = preferences.getPreferences();
    const schemaParseOptions: SchemaParseOptions = enableExportSchema
      ? {
          signal: abortSignal,
          storedValuesLengthLimit: 100,
          distinctFieldsAbortThreshold: DISTINCT_FIELDS_ABORT_THRESHOLD,
        }
      : {
          signal: abortSignal,
        };
    const schemaAccessor = await analyzeDocuments(
      sampleCursor,
      schemaParseOptions
    );
    log.info(mongoLogId(1001000090), 'Schema', 'Schema analysis completed', {
      ns,
    });
    return schemaAccessor;
  } catch (err: any) {
    log.error(mongoLogId(1001000091), 'Schema', 'Schema analysis failed', {
      ns,
      error: err.message,
      aborted: abortSignal.aborted,
      ...(abortSignal.aborted
        ? { abortReason: abortSignal.reason?.message ?? abortSignal.reason }
        : {}),
    });

    if (abortSignal.aborted) {
      // The operation was aborted, so we don't throw an error.
      debug('caught background operation terminated error', err);
      return;
    }

    const error = promoteMongoErrorCode(err);

    debug('schema analysis failed', err);
    throw error;
  }
};

function isSchemaType(
  fieldOrType: SchemaField | SchemaType
): fieldOrType is SchemaType {
  return (fieldOrType as SchemaType).bsonType !== undefined;
}

const MONGODB_GEO_TYPES = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection',
];

// Every 1000 iterations, unblock the thread.
const UNBLOCK_INTERVAL_COUNT = 1000;
const unblockThread = async () =>
  new Promise<void>((resolve) => setTimeout(resolve));

export async function calculateSchemaMetadata(schema: Schema): Promise<{
  /**
   * Key/value pairs of bsonType and count.
   */
  field_types: {
    [bsonType: string]: number;
  };

  /**
   * The count of fields with multiple types in a given schema (not counting undefined).
   * This is only calculated for the top level fields, not nested fields and arrays.
   */
  variable_type_count: number;

  /**
   * The count of fields that don't appear on all documents.
   * This is only calculated for the top level fields, not nested fields and arrays.
   */
  optional_field_count: number;

  /**
   * The number of nested levels.
   */
  schema_depth: number;

  /**
   * Indicates whether the schema contains geospatial data.
   */
  geo_data: boolean;
}> {
  let hasGeoData = false;
  const fieldTypes: {
    [bsonType: string]: number;
  } = {};
  let variableTypeCount = 0;
  let optionalFieldCount = 0;
  let unblockThreadCounter = 0;
  let deepestPath = 0;

  async function traverseSchemaTree(
    fieldsOrTypes: SchemaField[] | SchemaType[],
    depth: number
  ): Promise<void> {
    unblockThreadCounter++;
    if (unblockThreadCounter === UNBLOCK_INTERVAL_COUNT) {
      unblockThreadCounter = 0;
      await unblockThread();
    }

    if (!fieldsOrTypes || fieldsOrTypes.length === 0) {
      return;
    }

    deepestPath = Math.max(depth, deepestPath);

    for (const fieldOrType of fieldsOrTypes) {
      if (
        fieldOrType.path[fieldOrType.path.length - 1] === 'type' &&
        (fieldOrType as PrimitiveSchemaType).values &&
        MONGODB_GEO_TYPES.find((geoType) =>
          (fieldOrType as PrimitiveSchemaType).values?.find(
            (value) => value === geoType
          )
        )
      ) {
        hasGeoData = true;
      }

      if (isSchemaType(fieldOrType)) {
        if (fieldOrType.bsonType !== 'Undefined') {
          fieldTypes[fieldOrType.bsonType] =
            (fieldTypes[fieldOrType.bsonType] ?? 0) + 1;
        }
      } else if (depth === 1 /* is root level */) {
        // Count variable types (more than one unique type excluding undefined).
        if (
          fieldOrType.types &&
          (fieldOrType.types.length > 2 ||
            fieldOrType.types?.filter((t) => t.name !== 'Undefined').length > 1)
        ) {
          variableTypeCount++;
        }

        if (fieldOrType.probability < 1) {
          optionalFieldCount++;
        }
      }

      if ((fieldOrType as DocumentSchemaType).bsonType === 'Document') {
        await traverseSchemaTree(
          (fieldOrType as DocumentSchemaType).fields,
          depth + 1 // Increment by one when we go a level deeper.
        );
      } else if (
        (fieldOrType as ArraySchemaType).bsonType === 'Array' ||
        (fieldOrType as SchemaField).types
      ) {
        const increment =
          (fieldOrType as ArraySchemaType).bsonType === 'Array' ? 1 : 0;
        await traverseSchemaTree(
          (fieldOrType as ArraySchemaType | SchemaField).types,
          depth + increment // Increment by one when we go a level deeper.
        );
      }
    }
  }

  await traverseSchemaTree(schema.fields, 1);

  return {
    field_types: fieldTypes,
    geo_data: hasGeoData,
    optional_field_count: optionalFieldCount,
    schema_depth: deepestPath,
    variable_type_count: variableTypeCount,
  };
}
