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
  type AtlasGroupCluster,
  type AtlasGroupClusterResponse,
} from './cluster-types';
import {
  assertSystemStatus,
  type AtlasSystemStatus,
} from './system-status-types';
import { connectionStringMatches, extractConnectionStrings } from './util';
import { getAtlasAdminApiAcceptHeader } from './version';
import type { operations } from '../openapi/v2';
import type { DefaultVersionOf, Response, Versions } from './openapi-helpers';

export type AtlasProjectAndCluster = {
  projectId: string;
  clusterName: string;
};

export type AtlasAdminApiRequestOptions<V extends string = string> = {
  /**
   * Overrides the Atlas Admin API resource version for this request. Defaults
   * to `ATLAS_ADMIN_API_DEFAULT_VERSION`.
   */
  version?: V;
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

  // `op` is not used yet; it is here so the Accept header can later be derived
  // per operation.
  private async fetchJson<Op extends keyof operations>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    op: Op,
    requestUrl: string,
    { version }: AtlasAdminApiRequestOptions<Versions<Op>> = {}
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
  private async fetchAllPages<T, Op extends keyof operations>(
    op: Op,
    buildEndpoint: (pagination: AtlasPaginationOptions) => string,
    options?: AtlasAdminApiRequestOptions<Versions<Op>>
  ): Promise<T[]> {
    const results: T[] = [];
    let pageNum = 1;
    let hasNextPage = true;
    while (hasNextPage) {
      const requestUrl = buildEndpoint({
        pageNum,
        itemsPerPage: ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE,
      });
      const json = await this.fetchJson(op, requestUrl, options);
      assertPaginatedResponse<T>(json);
      results.push(...json.results);
      hasNextPage =
        json.totalCount > pageNum * ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE;
      pageNum++;
    }
    return results;
  }

  /**
   * Fetches the Atlas Admin API system status, which reports the public IP
   * address the request came from and, when authenticated as a user, that user
   * (the username is the email the user is logged in with).
   */
  async getSystemStatus(
    options?: AtlasAdminApiRequestOptions<Versions<'getSystemStatus'>>
  ): Promise<AtlasSystemStatus> {
    const requestUrl = this.atlasService.adminApiEndpoint('/v2');
    const json = await this.fetchJson('getSystemStatus', requestUrl, options);
    assertSystemStatus(json);
    return {
      ipAddress: json.ipAddress,
      ...(json.user && { user: { username: json.user.username } }),
    };
  }

  async listGroupIds(): Promise<string[]> {
    const clusters = await this.fetchAllPages<
      Response<'listClusterDetails'>['results'][number],
      'listClusterDetails'
    >('listClusterDetails', (pagination) =>
      this.atlasService.adminApiEndpoint(
        `/v2/clusters${buildPaginationQuery(pagination)}`
      )
    );
    return [
      ...new Set(
        clusters
          .map((cluster) => cluster.groupId)
          .filter((groupId): groupId is string => groupId !== undefined)
      ),
    ];
  }

  async listConnectionStrings(groupId: string): Promise<AtlasGroupCluster[]> {
    const encodedGroupId = encodeURIComponent(groupId);
    const clusters = await this.fetchAllPages<
      AtlasGroupClusterResponse,
      'listGroupClusters'
    >('listGroupClusters', (pagination) =>
      this.atlasService.adminApiEndpoint(
        `/v2/groups/${encodedGroupId}/clusters${buildPaginationQuery(
          pagination
        )}`
      )
    );
    return clusters.flatMap((cluster) =>
      cluster.name
        ? {
            clusterName: cluster.name,
            connectionStrings: extractConnectionStrings(
              cluster.connectionStrings
            ),
          }
        : []
    );
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

  async getClusterState<
    V extends Versions<'getGroupCluster'> = DefaultVersionOf<'getGroupCluster'>
  >(
    groupId: string,
    clusterName: string,
    options?: AtlasAdminApiRequestOptions<V>
  ): Promise<{ state: AtlasClusterState; paused: boolean }> {
    const encodedGroupId = encodeURIComponent(groupId);
    const encodedClusterName = encodeURIComponent(clusterName);
    const requestUrl = this.atlasService.adminApiEndpoint(
      `/v2/groups/${encodedGroupId}/clusters/${encodedClusterName}`
    );
    const json = await this.fetchJson('getGroupCluster', requestUrl, options);
    assertClusterState(json);
    return {
      state: json.stateName,
      paused: json.paused,
    };
  }

  async getProjectIPAccessList<
    V extends Versions<'listGroupAccessListEntries'> = DefaultVersionOf<'listGroupAccessListEntries'>
  >(
    groupId: string,
    options?: AtlasAdminApiRequestOptions<V>
  ): Promise<Response<'listGroupAccessListEntries', V>['results']> {
    const encodedGroupId = encodeURIComponent(groupId);
    return await this.fetchAllPages<
      Response<'listGroupAccessListEntries', V>['results'][number],
      'listGroupAccessListEntries'
    >(
      'listGroupAccessListEntries',
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
