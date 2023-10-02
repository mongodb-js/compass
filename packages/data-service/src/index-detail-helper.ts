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
};

type IndexSize = number;

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
  properties: ('unique' | 'sparse' | 'partial' | 'ttl' | 'collation')[];
  extra: Record<string, string | number | Record<string, any>>;
  size: IndexSize;
  relativeSize: number;
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
  index: Pick<IndexDefinition, 'name' | 'key' | 'fields' | 'extra'>
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

export function createIndexDefinition(
  ns: string,
  { name, key, v, ...extra }: IndexInfo,
  indexStats?: IndexStats,
  indexSize?: number,
  maxSize?: number
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
    version: v,
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
    properties: getIndexProperties(index),
    size: indexSize,
    relativeSize: (indexSize / maxSize) * 100,
  };
}
