import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { CreateIndexesOptions, IndexSpecification } from 'mongodb';
import toNS from 'mongodb-ns';

export type AtlasIndexStats = {
  collName: string;
  dbName: string;
  indexName: string;
  indexProperties: { label: string; properties: Record<string, unknown> }[];
  indexType: { label: string };
  keys: { name: string; value: string | number }[];
  sizeBytes: number;
  status: 'rolling build' | 'building' | 'exists';
};

export class RollingIndexesService {
  constructor(
    private atlasService: Pick<
      AtlasService,
      | 'automationAgentRequest'
      | 'automationAgentAwait'
      | 'authenticatedFetch'
      | 'cloudEndpoint'
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
    indexSpec: IndexSpecification,
    { collation, ...options }: CreateIndexesOptions
  ): Promise<void> {
    const { atlasMetadata } = this.connectionInfo.current;

    if (!atlasMetadata) {
      throw new Error(
        "Can't create a rolling index for a non-Atlas cluster: atlasMetadata is not available"
      );
    }

    // Not possible to do through UI, doing a pre-check here to avoid dealing
    // with payload variations based on metricsType later
    if (
      atlasMetadata.metricsType === 'serverless' ||
      atlasMetadata.metricsType === 'flex'
    ) {
      throw new Error(
        'Flex clusters do not support rolling index build creation'
      );
    }

    // NB: Rolling indexes creation only pretends to be a "normal" automation
    // agent request, in practice while a bunch of request logic is similar,
    // both the resource URL and responses behave completely differently, so
    // that's why we're not using `automationAgentRequest` helper method here.

    const { database: db, collection } = toNS(namespace);

    const requestBody = {
      clusterId: atlasMetadata.metricsId,
      db,
      collection,
      keys: JSON.stringify(indexSpec),
      options: Object.keys(options).length > 0 ? JSON.stringify(options) : '',
      collationOptions: collation ? JSON.stringify(collation) : '',
    };

    const requestUrl = this.atlasService.cloudEndpoint(
      `/explorer/v1/groups/${atlasMetadata.projectId}/clusters/${atlasMetadata.metricsId}/index`
    );

    // Requesting a rolling index build doesn't return anything that we can
    // await on similar to other index creation processes (but
    // authenticatedFetch will make sure it fails if server responded with an
    // error) or automation agent jobs, this is why we're just submitting
    // without doing anything with a response
    await this.atlasService.authenticatedFetch(requestUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  }
}
