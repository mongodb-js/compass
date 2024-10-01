import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { CreateIndexesOptions } from 'mongodb';
import toNS from 'mongodb-ns';

type AtlasIndexStats = {
  collName: string;
  dbName: string;
  indexName: string;
  indexProperties: { label: string; properties: Record<string, unknown> }[];
  indexType: { label: string };
  keys: { name: string; value: string | number };
  sizeBytes: number;
  status: 'rolling build' | 'building' | 'exists';
};

export class RollingIndexesService {
  constructor(
    private atlasService: Pick<
      AtlasService,
      'automationAgentRequest' | 'automationAgentAwait'
    >,
    private connectionInfo: ConnectionInfoRef
  ) {}
  async listRollingIndexes(namespace: string): Promise<AtlasIndexStats[]> {
    const { atlasMetadata } = this.connectionInfo.current;
    if (!atlasMetadata) {
      throw new Error(
        "Can't list rolling indexes for a non-Atlas cluster: atlasMetadata is not available"
      );
    }
    const { database: db, collection } = toNS(namespace);
    const req = await this.atlasService.automationAgentRequest(
      atlasMetadata,
      'listIndexStats',
      { db, collection }
    );
    if (!req) {
      throw new Error(
        'Unexpected response from the automation agent backend: expected to get the request metadata, got undefined'
      );
    }
    const res = await this.atlasService.automationAgentAwait<AtlasIndexStats>(
      atlasMetadata,
      req.requestType,
      req._id
    );
    return res.response.filter((index) => {
      return index.status === 'rolling build';
    });
  }
  async createRollingIndex(
    namespace: string,
    indexSpec: Record<string, string | number>,
    { collation, ...options }: CreateIndexesOptions
  ): Promise<void> {
    const { atlasMetadata } = this.connectionInfo.current;
    if (!atlasMetadata) {
      throw new Error(
        "Can't create a rolling index for a non-Atlas cluster: atlasMetadata is not available"
      );
    }
    const { database: db, collection } = toNS(namespace);
    const res = await this.atlasService.automationAgentRequest(
      atlasMetadata,
      'index',
      {
        db,
        collection,
        keys: JSON.stringify(indexSpec),
        options: Object.keys(options).length > 0 ? JSON.stringify(options) : '',
        collationOptions: collation ? JSON.stringify(collation) : '',
      }
    );
    // Creating a rolling index doesn't return an "awaitable" job from
    // automation agent backend
    if (res) {
      throw new Error(
        `Unexpected response from the server, expected undefined, but got ${JSON.stringify(
          res
        )}`
      );
    }
    return undefined;
  }
}
