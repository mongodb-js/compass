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
 * Represents the build progress of an index being created.
 * This type captures information from $currentOp about in-progress index builds.
 */
export type IndexBuildProgress = {
  /**
   * Whether the index build operation is currently active.
   * If true and progress is undefined, the index is building but we don't have progress info.
   */
  active: boolean;
  /**
   * The progress of the index build as a fraction between 0 and 1.
   * May be undefined if the progress object is not available from $currentOp.
   */
  progress?: number;
  /**
   * How long the index build has been running in seconds.
   * Useful when progress is not available.
   */
  secsRunning?: number;
  /**
   * The current operation message from $currentOp (e.g. "Index Build: draining writes received during build").
   * Can be shown in a tooltip to provide additional context.
   */
  msg?: string;
  /**
   * If true, the user does not have permission to run $indexStats,
   * so we can't determine the index usage stats or building status from that source.
   */
  statsNotPermitted?: boolean;
  /**
   * If true, the user does not have permission to run $currentOp,
   * so we can't get detailed progress info (percentage, seconds running, msg).
   */
  progressNotPermitted?: boolean;
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
 * Default build progress indicating a completed/ready index
 */
const DEFAULT_BUILD_PROGRESS: IndexBuildProgress = { active: false };

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
    buildProgress: buildProgress ?? DEFAULT_BUILD_PROGRESS,
  };
}
