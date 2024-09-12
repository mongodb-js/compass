import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { ConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';
import type { CreateIndexesOptions } from 'mongodb';
import toNS from 'mongodb-ns';

export class RollingIndexesService {
  constructor(
    private atlasService: AtlasService,
    private connectionInfo: ConnectionInfoAccess
  ) {}
  async listRollingIndexes(namespace: string) {
    const { atlasMetadata } = this.connectionInfo.getCurrentConnectionInfo();
    if (!atlasMetadata) {
      throw new Error(
        "Can't list rolling indexes for a non-Atlas cluster: atlasMetadata is not available"
      );
    }
    const { database: db, collection } = toNS(namespace);
    const indexes = await this.atlasService.automationAgentFetch(
      atlasMetadata,
      'listIndexStats',
      { db, collection }
    );
    return indexes.filter((index) => {
      return index.status === 'rolling build';
    });
  }
  createRollingIndex(
    namespace: string,
    indexSpec: Record<string, string | number>,
    { collation, ...options }: CreateIndexesOptions
  ): Promise<void> {
    const { atlasMetadata } = this.connectionInfo.getCurrentConnectionInfo();
    if (!atlasMetadata) {
      throw new Error(
        "Can't create a rolling index for a non-Atlas cluster: atlasMetadata is not available"
      );
    }
    const { database: db, collection } = toNS(namespace);
    return this.atlasService.automationAgentFetch(atlasMetadata, 'index', {
      db,
      collection,
      keys: JSON.stringify(indexSpec),
      options: Object.keys(options).length > 0 ? JSON.stringify(options) : '',
      collationOptions: collation ? JSON.stringify(collation) : '',
    });
  }
}
