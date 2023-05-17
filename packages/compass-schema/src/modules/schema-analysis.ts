import { isInternalFieldPath } from 'hadron-document';
import type { AggregateOptions, Filter, Document } from 'mongodb';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { DataService } from 'mongodb-data-service';
import mongodbSchema from 'mongodb-schema';
import type {
  Schema,
  ArraySchemaType,
  DocumentSchemaType,
  SchemaField,
  SchemaType,
  PrimitiveSchemaType,
} from 'mongodb-schema';

const { log, mongoLogId, debug } = createLoggerAndTelemetry('COMPASS-SCHEMA');

const MONGODB_GEO_TYPES = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection',
];

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
  dataService: Pick<DataService, 'sample' | 'isCancelError'>,
  abortSignal: AbortSignal,
  ns: string,
  query:
    | {
        query?: Filter<Document>;
        size?: number;
        fields?: Document;
      }
    | undefined,
  aggregateOptions: AggregateOptions
) => {
  try {
    log.info(mongoLogId(1001000089), 'Schema', 'Starting schema analysis', {
      ns,
    });

    const docs = await dataService.sample(
      ns,
      query,
      {
        ...aggregateOptions,
        promoteValues: false,
      },
      {
        abortSignal,
      }
    );
    const schemaData = await mongodbSchema(docs);
    schemaData.fields = schemaData.fields.filter(
      ({ path }) => !isInternalFieldPath(path[0])
    );
    log.info(mongoLogId(1001000090), 'Schema', 'Schema analysis completed', {
      ns,
    });
    return schemaData;
  } catch (err: any) {
    log.error(mongoLogId(1001000091), 'Schema', 'Schema analysis failed', {
      ns,
      error: err.message,
    });
    if (dataService.isCancelError(err)) {
      debug('caught background operation terminated error', err);
      return null;
    }

    const error = promoteMongoErrorCode(err);

    debug('schema analysis failed', err);
    throw error;
  }
};

function _calculateSchemaFieldDepth(
  fieldsOrTypes: SchemaField[] | SchemaType[]
): number {
  if (!fieldsOrTypes) {
    return 0;
  }

  let deepestPath = 0;
  for (const fieldOrType of fieldsOrTypes) {
    if ((fieldOrType as DocumentSchemaType).bsonType === 'Document') {
      const deepestFieldPath = _calculateSchemaFieldDepth(
        (fieldOrType as DocumentSchemaType).fields
      );
      deepestPath = Math.max(deepestPath, deepestFieldPath);
    } else if (
      (fieldOrType as ArraySchemaType).bsonType === 'Array' ||
      (fieldOrType as SchemaField).types
    ) {
      const deepestFieldPath = _calculateSchemaFieldDepth(
        (fieldOrType as ArraySchemaType | SchemaField).types
      );

      // In the analyzed schema structure, a path to an array item
      // is not counted so we increment by 1.
      // TODO: Maybe we don't need to anymore
      deepestPath = Math.max(deepestFieldPath, deepestPath);
    }
  }

  return deepestPath + 1;
}

export function calculateSchemaDepth(schema: Schema): number {
  const schemaDepth = _calculateSchemaFieldDepth(schema.fields);
  return schemaDepth;
}

function _containsGeoData(
  fieldsOrTypes: SchemaField[] | SchemaType[]
): boolean {
  if (!fieldsOrTypes) {
    return false;
  }

  for (const fieldOrType of fieldsOrTypes) {
    if (
      fieldOrType.path[fieldOrType.path.length - 1] === 'path' &&
      (fieldOrType as PrimitiveSchemaType).values &&
      MONGODB_GEO_TYPES.find((geoType) =>
        (fieldOrType as PrimitiveSchemaType).values?.find(
          (value) => value === geoType
        )
      )
    ) {
      return true;
    }

    const hasGeoData = _containsGeoData(
      (fieldOrType as ArraySchemaType | SchemaField).types ??
        (fieldOrType as DocumentSchemaType).fields
    );
    if (hasGeoData) {
      return true;
    }
  }
  return false;
}

export function schemaContainsGeoData(schema: Schema): boolean {
  return _containsGeoData(schema.fields);
}
