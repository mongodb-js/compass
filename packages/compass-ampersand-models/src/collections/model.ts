import type {
  AmpersandCollectionInstance,
  AmpersandModelInstance,
  AmpersandModelPropertiesFromConstructor,
} from 'ampersand-model';
import type { DataService } from 'mongodb-data-service';
import AmpersandModel from 'ampersand-model';
import AmpersandCollection from 'ampersand-collection';
import { promisify } from 'util';
import type toNs from 'mongodb-ns';
import { getProperties } from './collection-properties';
import type { ModelStatus } from '../util';
import {
  debounceActions,
  getNamespaceInfo,
  shouldFetch,
  mergeInit,
  propagateCollectionEvents,
  getParentByType,
  ModelStatusValues,
} from '../util';

type PromiseReturnType<Fn> = Fn extends (...args: any[]) => Promise<infer R>
  ? R
  : never;

type NonNullable<T> = Exclude<T, null>;

function pickCollectionInfo({
  readonly,
  view_on,
  collation,
  pipeline,
  validation,
  clustered,
}: Partial<NonNullable<PromiseReturnType<DataService['collectionInfo']>>>) {
  return { readonly, view_on, collation, pipeline, validation, clustered };
}

const collectionProps = {
  _id: { type: 'string', required: true },
  type: { type: 'string', default: 'collection' },
  status: {
    type: 'string',
    default: 'initial',
    required: true,
    values: ModelStatusValues,
  },
  statusError: { type: 'string', default: null },

  // Normalized values from collectionInfo command
  readonly: 'boolean',
  view_on: 'string',
  collation: 'object',
  pipeline: 'array',
  validation: 'object',
  clustered: 'boolean',

  // Normalized values from collStats command
  is_capped: 'boolean',
  max: 'number',
  is_power_of_two: 'boolean',
  index_sizes: 'object',
  document_count: 'number',
  document_size: 'number',
  avg_document_size: 'number',
  storage_size: 'number',
  free_storage_size: 'number',
  index_count: 'number',
  index_size: 'number',
  padding_factor: 'number',
  extent_count: 'number',
  extent_last_size: 'number',
  flags_user: 'number',
  max_document_size: 'number',
  size: 'number',
  index_details: 'object',
  wired_tiger: 'object',
} as const;

// Can't reference all derived props in derived props definition due to recursive
// type definition
type SimplifiedCollectionModel = AmpersandModelInstance<
  typeof collectionProps,
  unknown,
  unknown,
  unknown,
  unknown,
  {
    sourceId?: string | null;
    source?: SimplifiedCollectionModel;
    isTimeSeries: boolean;
  } & Pick<
    ReturnType<typeof toNs>,
    | 'ns'
    | 'collection'
    | 'database'
    | 'system'
    | 'oplog'
    | 'command'
    | 'special'
    | 'specialish'
    | 'normal'
  > & {
      fetch(...args: any[]): Promise<void>;
      toJSON(...args: any[]): SimplifiedCollectionModel;
    }
>;

const CollectionModel = AmpersandModel.extend(debounceActions(['fetch']), {
  modelType: 'Collection',
  idAttribute: '_id',
  props: collectionProps,
  derived: {
    ns: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).ns;
      },
    },
    name: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).collection;
      },
    },
    collection: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).collection;
      },
    },
    database: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).database;
      },
    },
    system: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).system;
      },
    },
    oplog: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).oplog;
      },
    },
    command: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).command;
      },
    },
    special: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).special;
      },
    },
    specialish: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).specialish;
      },
    },
    normal: {
      deps: ['_id'],
      fn(this: SimplifiedCollectionModel) {
        return getNamespaceInfo(this._id).normal;
      },
    },

    isTimeSeries: {
      deps: ['type'],
      fn(this: SimplifiedCollectionModel) {
        return this.type === 'timeseries';
      },
    },

    isView: {
      deps: ['type'],
      fn(this: SimplifiedCollectionModel) {
        return this.type === 'view';
      },
    },

    sourceId: {
      deps: ['view_on'],
      fn(this: SimplifiedCollectionModel) {
        return this.view_on ? `${this.database}.${this.view_on}` : null;
      },
    },

    source: {
      deps: ['sourceId'],
      fn(this: SimplifiedCollectionModel) {
        return this.collection.get(this.sourceId) ?? null;
      },
    },

    properties: {
      deps: ['collation', 'type', 'capped', 'clustered', 'readonly'],
      fn(this: SimplifiedCollectionModel) {
        return getProperties(this);
      },
    },
  },

  async fetch(
    this: SimplifiedCollectionModel,
    {
      dataService,
      fetchInfo = true,
      force = false,
    }: { dataService: DataService; fetchInfo: boolean; force: boolean }
  ) {
    if (!shouldFetch(this.status as ModelStatus, force)) {
      return;
    }
    const collectionStatsAsync = promisify(
      dataService.collectionStats.bind(dataService)
    );
    try {
      const newStatus = this.status === 'initial' ? 'fetching' : 'refreshing';
      this.set({ status: newStatus });
      const [collStats, collectionInfo] = await Promise.all([
        collectionStatsAsync(this.database, this.collection),
        fetchInfo
          ? dataService.collectionInfo(this.database, this.collection)
          : null,
      ]);
      this.set({
        status: 'ready',
        statusError: null,
        ...collStats,
        ...(collectionInfo && pickCollectionInfo(collectionInfo)),
      });
    } catch (err) {
      this.set({ status: 'error', statusError: (err as Error).message });
      throw err;
    }
  },

  /**
   * Fetches collection info and returns a special format of collection metadata
   * that events like open-in-new-tab, select-namespace, edit-view require
   */
  async fetchMetadata(
    this: SimplifiedCollectionModel,
    { dataService }: { dataService: DataService }
  ) {
    try {
      await this.fetch({ dataService });
    } catch (e) {
      if ((e as Error).name !== 'MongoServerError') {
        throw e;
      }
      // We don't care if it fails to get stats from server for any reason
    }
    const collectionMetadata = {
      namespace: this.ns,
      isReadonly: this.readonly,
      isTimeSeries: this.isTimeSeries,
      isClustered: this.clustered,
    };
    if (this.sourceId && this.source) {
      try {
        await this.source.fetch({ dataService });
      } catch (e) {
        if ((e as Error).name !== 'MongoServerError') {
          throw e;
        }
        // We don't care if it fails to get stats from server for any reason
      }
      Object.assign(collectionMetadata, {
        sourceName: this.source.ns,
        sourceReadonly: this.source.readonly,
        sourceViewon: this.source.sourceId,
        sourcePipeline: this.pipeline,
      });
    }
    return collectionMetadata;
  },

  toJSON(
    this: SimplifiedCollectionModel,
    opts = { derived: true }
  ) {
    const serialized = this.serialize(opts) as any;
    if (serialized.source) {
      serialized.source = serialized.source.toJSON();
    }
    return serialized;
  },
});

type SimplifiedCollectionCollection = AmpersandCollectionInstance<
  typeof CollectionModel,
  { modelType: string }
>;

const CollectionCollection = AmpersandCollection.extend(
  mergeInit(
    debounceActions(['fetch']),
    propagateCollectionEvents('collections')
  ),
  {
    modelType: 'CollectionCollection',
    mainIndex: '_id',
    indexes: ['name'],
    comparator: '_id',
    model: CollectionModel,

    async fetch(
      this: SimplifiedCollectionCollection,
      {
        dataService,
        fetchInfo = true,
      }: { dataService: DataService; fetchInfo: boolean }
    ) {
      const databaseName = getParentByType(this, 'Database')?.getId();

      if (!databaseName) {
        throw new Error(
          `Trying to fetch ${this.modelType} that doesn't have the Database parent model`
        );
      }

      const instanceModel = getParentByType(this, 'Instance');

      if (!instanceModel) {
        throw new Error(
          `Trying to fetch ${this.modelType} that doesn't have the Instance parent model`
        );
      }

      const collections = await dataService.listCollections(
        databaseName,
        {},
        { nameOnly: !fetchInfo, privileges: instanceModel.auth.privileges }
      );

      this.set(
        collections
          .filter((coll) => {
            // TODO: This is not the best place to do this kind of
            // filtering, but for now this preserves the current behavior
            // and changing it right away will expand the scope of the
            // refactor significantly. We can address this in COMPASS-5211
            return getNamespaceInfo(coll._id).system === false;
          })
          .map(({ _id, type, ...rest }) => {
            return {
              _id,
              type,
              ...(fetchInfo && pickCollectionInfo(rest)),
            };
          })
      );
    },

    toJSON(this: SimplifiedCollectionCollection, opts = { derived: true }) {
      return this.map((item) => item.toJSON(opts));
    },
  }
);

CollectionCollection.prototype[Symbol.iterator] = function* () {
  for (let i = 0, len = this.length; i < len; i++) {
    yield this.at(i);
  }
};

export { CollectionModel, CollectionCollection };
