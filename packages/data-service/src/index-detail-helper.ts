import { isDeepStrictEqual } from 'util';
import { EJSON } from 'bson';
import type { IndexDescriptionInfo } from 'mongodb';

export type IndexInfo = {
  ns?: string;
  name: string;
  key: Record<string, string | number>;
  v: number;
  // Various extra index info
  [key: string]: unknown;
};

export type IndexStats = {
  name: string;
  usageCount?: number;
  usageHost?: string;
  usageSince?: Date;
  /**
   * Whether the index is currently being built.
   * This comes from $indexStats and is present (true) when the index is building,
   * or absent/undefined when the index is ready.
   */
  building?: boolean;
};

type IndexSize = number;

/**
 * Raw per-index data from $currentOp about an in-progress index build.
 */
export type CurrentOpProgress = {
  active: boolean;
  progress?: number;
  secsRunning?: number;
  msg?: string;
};

/**
 * Build progress information for an index, containing raw data from
 * the $currentOp and $indexStats pipelines plus their error states.
 * The data service returns this as-is; consumers decide how to interpret it.
 */
export type IndexBuildProgress = {
  /**
   * Raw per-index data from $currentOp.
   * Undefined when $currentOp failed or had no entry for this index.
   */
  currentOp?: CurrentOpProgress;
  /**
   * Error message if $indexStats failed (e.g. insufficient permissions).
   * When set, index usage stats and the `building` flag from $indexStats
   * are unavailable.
   */
  statsError?: string;
  /**
   * Error message if $currentOp failed (e.g. insufficient permissions).
   * When set, detailed progress info (percentage, seconds running, msg)
   * is unavailable.
   */
  progressError?: string;
};

export type IndexDefinition = {
  ns: string;
  name: string;
  key: IndexInfo['key'];
  version: number;
  fields: { field: string; value: number | string }[];
  type:
    | 'regular'
    | 'geospatial'
    | 'hashed'
    | 'text'
    | 'wildcard'
    | 'clustered'
    | 'columnstore';
  cardinality: 'single' | 'compound';
  properties: (
    | 'unique'
    | 'sparse'
    | 'partial'
    | 'ttl'
    | 'collation'
    | 'shardKey'
  )[];
  extra: Record<string, string | number | boolean | Record<string, any>>;
  size: IndexSize;
  relativeSize: number;
  buildProgress: IndexBuildProgress;
} & IndexStats;

export function getIndexCardinality(
  index: Pick<IndexDefinition, 'key' | 'fields' | 'extra'>
): IndexDefinition['cardinality'] {
  const isSingleTextIndex =
    !!index.extra.textIndexVersion &&
    index.fields.length === 2 &&
    Object.keys(index.extra.weights).length === 1;

  if (isSingleTextIndex) {
    return 'single';
  }

  return index.fields.length === 1 ? 'single' : 'compound';
}

export function getIndexProperties(
  index: Pick<IndexDefinition, 'name' | 'key' | 'fields' | 'extra'>,
  collectionShardKey: unknown
): IndexDefinition['properties'] {
  const properties: IndexDefinition['properties'] = [];

  if (index.name === '_id_' || !!index.extra.unique) {
    properties.push('unique');
  }

  if (index.extra.sparse) {
    properties.push('sparse');
  }

  if (index.extra.partialFilterExpression) {
    properties.push('partial');
  }

  if (Number(index.extra.expireAfterSeconds) > -1) {
    properties.push('ttl');
  }

  if (index.extra.collation) {
    properties.push('collation');
  }

  if (
    collectionShardKey &&
    isDeepStrictEqual(
      EJSON.serialize(collectionShardKey),
      EJSON.serialize(index.key)
    )
  ) {
    properties.push('shardKey');
  }

  return properties;
}

export function getIndexType(
  index: Pick<IndexDefinition, 'extra' | 'key'>
): IndexDefinition['type'] {
  const keyNames = Object.keys(index.key);
  const keyValues = Object.values(index.key);
  if (
    !!index.extra['2dsphereIndexVersion'] ||
    keyValues.includes('2d') ||
    keyValues.includes('geoHaystack')
  ) {
    return 'geospatial';
  }
  if (keyValues.includes('hashed')) {
    return 'hashed';
  }
  if (index.extra.textIndexVersion) {
    return 'text';
  }
  // Columnstore is before wildcard as it is a special case of wildcard.
  if (keyValues.includes('columnstore')) {
    return 'columnstore';
  }
  if (
    keyNames.some((k) => {
      return k === '$**' || String(k).includes('.$**');
    })
  ) {
    return 'wildcard';
  }
  if (index.extra.clustered) {
    return 'clustered';
  }
  return 'regular';
}

/**
 * Default build progress indicating no errors and no currentOp data.
 */
const DEFAULT_BUILD_PROGRESS: IndexBuildProgress = {};

export function createIndexDefinition(
  ns: string,
  collectionShardKey: unknown,
  {
    name,
    key,
    v,
    ...extra
  }: IndexDescriptionInfo & {
    name: string;
  },
  indexStats?: IndexStats,
  indexSize?: number,
  maxSize?: number,
  buildProgress?: IndexBuildProgress
): IndexDefinition {
  indexStats ??= {
    name,
    usageHost: '',
    usageSince: new Date(0),
  };
  indexSize ??= 0;
  maxSize ??= 0;

  const index = {
    ns,
    name,
    key,
    version: v ?? 1,
    fields: Object.entries(key).map(([field, value]) => {
      return { field, value };
    }),
    extra: extra as IndexDefinition['extra'],
  };

  return {
    ...index,
    ...indexStats,
    type: getIndexType(index),
    cardinality: getIndexCardinality(index),
    properties: getIndexProperties(index, collectionShardKey),
    size: indexSize,
    relativeSize: (indexSize / maxSize) * 100,
    buildProgress: buildProgress ?? { ...DEFAULT_BUILD_PROGRESS },
  };
}
