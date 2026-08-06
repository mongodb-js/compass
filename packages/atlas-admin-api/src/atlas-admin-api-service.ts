import ConnectionString from 'mongodb-connection-string-url';
import { type AtlasService } from '@mongodb-js/atlas-service/provider';
import {
  ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE,
  assertPaginatedResponse,
  buildPaginationQuery,
  type AtlasPaginationOptions,
} from './pagination';
import {
  assertClusterState,
  type AtlasClusterState,
  type AtlasAccessListEntry,
  type AtlasGroupCluster,
  type AtlasGroupClusterResponse,
} from './cluster-types';
import { connectionStringMatches, extractConnectionStrings } from './util';
import { getAtlasAdminApiAcceptHeader } from './version';

export type AtlasProjectAndCluster = {
  projectId: string;
  clusterName: string;
};

export type AtlasAdminApiRequestOptions = {
  /**
   * Overrides the Atlas Admin API resource version for this request. Defaults
   * to `ATLAS_ADMIN_API_DEFAULT_VERSION`.
   */
  version?: string;
};

/**
 * Provides access to the Atlas Admin API cluster endpoints. Injects an
 * AtlasService and uses it internally for network requests, keeping the
 * concrete admin-API routes (and the pagination plumbing they need) scoped to
 * this package.
 */
export class AtlasAdminApiService {
  private readonly atlasService: Pick<
    AtlasService,
    'adminApiEndpoint' | 'authenticatedFetch'
  >;

  /**
   * Resolved project / cluster per connection string. The mapping is
   * effectively immutable: an Atlas hostname derives from the cluster name plus
   * a per-project suffix, so renaming or moving a cluster produces a different
   * connection string rather than remapping an existing one. Only successful
   * lookups are stored - a miss can become a hit once a cluster finishes
   * provisioning.
   */
  private readonly projectAndClusterCache = new Map<
    string,
    Promise<AtlasProjectAndCluster | undefined>
  >();

  constructor(
    atlasService: Pick<AtlasService, 'adminApiEndpoint' | 'authenticatedFetch'>
  ) {
    this.atlasService = atlasService;
  }

  private async fetchJson(
    requestUrl: string,
    { version }: AtlasAdminApiRequestOptions = {}
  ): Promise<unknown> {
    return await this.atlasService
      .authenticatedFetch(requestUrl, {
        method: 'GET',
        headers: { Accept: getAtlasAdminApiAcceptHeader(version) },
      })
      .then((res) => res.json());
  }

  /**
   * Generic batch fetcher for Atlas Admin API paginated endpoints. Pages
   * through every result, delegating the concrete endpoint URL (including its
   * pagination query) to the caller so this stays agnostic of any specific
   * admin-API route.
   */
  private async fetchAllPages<T>(
    buildEndpoint: (pagination: AtlasPaginationOptions) => string,
    options?: AtlasAdminApiRequestOptions
  ): Promise<T[]> {
    const results: T[] = [];
    let pageNum = 1;
    let hasNextPage = true;
    while (hasNextPage) {
      const requestUrl = buildEndpoint({
        pageNum,
        itemsPerPage: ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE,
      });
      const json = await this.fetchJson(requestUrl, options);
      assertPaginatedResponse<T>(json);
      results.push(...json.results);
      hasNextPage =
        json.totalCount > pageNum * ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE;
      pageNum++;
    }
    return results;
  }

  async listGroupIds(): Promise<string[]> {
    const clusters = await this.fetchAllPages<{ groupId: string }>(
      (pagination) =>
        this.atlasService.adminApiEndpoint(
          `/v2/clusters${buildPaginationQuery(pagination)}`
        )
    );
    return [...new Set(clusters.map((cluster) => cluster.groupId))];
  }

  async listConnectionStrings(groupId: string): Promise<AtlasGroupCluster[]> {
    const encodedGroupId = encodeURIComponent(groupId);
    const clusters = await this.fetchAllPages<AtlasGroupClusterResponse>(
      (pagination) =>
        this.atlasService.adminApiEndpoint(
          `/v2/groups/${encodedGroupId}/clusters${buildPaginationQuery(
            pagination
          )}`
        )
    );
    return clusters.map((cluster) => ({
      clusterName: cluster.name,
      connectionStrings: extractConnectionStrings(cluster.connectionStrings),
    }));
  }

  /**
   * Resolves the Atlas project and cluster a connection string belongs to.
   * Successful lookups are cached for the lifetime of the service, see
   * `clearCache`.
   */
  async getProjectIdAndClusterName(
    connectionString: string
  ): Promise<AtlasProjectAndCluster | undefined> {
    let input: ConnectionString;
    try {
      input = new ConnectionString(connectionString);
    } catch {
      return undefined;
    }

    const cacheKey = input.toString();
    const cached = this.projectAndClusterCache.get(cacheKey);
    if (cached) {
      return await cached;
    }

    // Cache the in-flight promise so concurrent callers share one lookup, then
    // drop the entry again if it fails or finds nothing: a rejected request
    // must not poison the key, and a cluster that is still provisioning should
    // be found on a later attempt.
    const lookup = this.findProjectIdAndClusterName(input);
    this.projectAndClusterCache.set(cacheKey, lookup);
    try {
      const result = await lookup;
      if (!result) {
        this.projectAndClusterCache.delete(cacheKey);
      }
      return result;
    } catch (err) {
      this.projectAndClusterCache.delete(cacheKey);
      throw err;
    }
  }

  private async findProjectIdAndClusterName(
    input: ConnectionString
  ): Promise<AtlasProjectAndCluster | undefined> {
    const groupIds = await this.listGroupIds();
    for (const groupId of groupIds) {
      const clusters = await this.listConnectionStrings(groupId);
      for (const cluster of clusters) {
        if (
          cluster.connectionStrings.some((candidate) =>
            connectionStringMatches(input, candidate)
          )
        ) {
          return { projectId: groupId, clusterName: cluster.clusterName };
        }
      }
    }
    return undefined;
  }

  clearCache(): void {
    this.projectAndClusterCache.clear();
  }

  async getClusterState(
    groupId: string,
    clusterName: string,
    options?: AtlasAdminApiRequestOptions
  ): Promise<{ state: AtlasClusterState; paused: boolean }> {
    const encodedGroupId = encodeURIComponent(groupId);
    const encodedClusterName = encodeURIComponent(clusterName);
    const requestUrl = this.atlasService.adminApiEndpoint(
      `/v2/groups/${encodedGroupId}/clusters/${encodedClusterName}`
    );
    const json = await this.fetchJson(requestUrl, options);
    assertClusterState(json);
    return {
      state: json.stateName,
      paused: json.paused,
    };
  }

  async getProjectIPAccessList(
    groupId: string,
    options?: AtlasAdminApiRequestOptions
  ): Promise<AtlasAccessListEntry[]> {
    const encodedGroupId = encodeURIComponent(groupId);
    return await this.fetchAllPages<AtlasAccessListEntry>(
      (pagination) =>
        this.atlasService.adminApiEndpoint(
          `/v2/groups/${encodedGroupId}/accessList${buildPaginationQuery(
            pagination
          )}`
        ),
      options
    );
  }
}
