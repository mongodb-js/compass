import type { ConnectionOptions } from 'mongodb-data-service';

/**
 * Atlas metadata for clusters, refer to the backend implementation to see how
 * the values are derived
 *
 * https://github.com/10gen/mms/blob/1efe59a9bb4646635d946d979e5c9f4423f95b10/server/src/main/com/xgen/svc/mms/res/view/explorer/DataExplorerConnectionInfoView.java#L223-L302
 */
export interface AtlasClusterMetadata {
  /**
   * Atlas organization id
   */
  orgId: string;

  /**
   * Project ID that uniquely identifies an Atlas project. Legacy name is
   * "groupId" as projects were previously identified as "groups".
   *
   * https://www.mongodb.com/docs/atlas/api/atlas-admin-api-ref/#project-id
   */
  projectId: string;

  /**
   * Unique id returned with the clusterDescription
   */
  clusterUniqueId: string;

  /**
   * Cluster name, unique inside same project
   */
  clusterName: string;

  /**
   * Possible types of Atlas clusters.
   *
   * https://github.com/10gen/mms/blob/9e6bf2d81d4d85b5ac68a15bf471dcddc5922323/client/packages/types/nds/clusterDescription.ts#L12-L16
   */
  clusterType: 'REPLICASET' | 'SHARDED' | 'GEOSHARDED';

  /**
   * Cluster states
   *
   * `DELETED` is never returned from backend, but can be derived by connection
   * missing when polling connection info list
   */
  clusterState:
    | 'CREATING'
    | 'UPDATING'
    | 'PAUSED'
    | 'IDLE'
    | 'REPAIRING'
    | 'DELETING'
    | 'DELETED';

  /**
   * A special id and type that are only relevant in context of mms metrics
   * features. These are deployment items props (with a special exception for
   * serverless, where id is just name, and type is `serverless` that doesn't
   * make sense in context of deployments), not cluster description props.

   * https://github.com/10gen/mms/blob/43b0049a85196b44e465feb9b96ef942d6f2c8f4/client/js/legacy/core/models/deployment
   */
  metricsId: string;

  /**
   * Somewhat related to the clusterType provided as part of clusterDescription,
   * but accounting for special shared cluster types. Used for `/metrics/*`
   * routing and automation agent jobs
   *
   *   - `cluster`:    any sharded cluster type (sharded or geo sharded /
   *                   "global writes" one)
   *   - `replicaSet`: anything that is not sharded (both dedicated or "free
   *                   tier" / MTM)
   *   - `serverless`: specifically for serverless clusters
   *   - `flex`:       new type that replaces serverless and some shared
   *                   clusters
   */
  metricsType: 'replicaSet' | 'cluster' | 'serverless' | 'flex';

  /**
   * Atlas API base url to be used when making control plane requests for a
   * regionalized cluster. Always `null` while compass-web is disabled for
   * those types of clusters
   */
  regionalBaseUrl: null;

  /*
   * At the time of writing these are the possible instance sizes. If we include
   * the list in the type here , then we'll have to maintain it..
   *
   * https://github.com/10gen/mms/blob/9e6bf2d81d4d85b5ac68a15bf471dcddc5922323/client/packages/types/nds/provider.ts#L60-L107
   */
  instanceSize?: string;

  /**
   * Flags indicating Atlas cluster-level control plane feature support
   */
  supports: {
    /**
     * True if cluster is geo sharded and not self managed
     */
    globalWrites: boolean;

    /**
     * True for dedicated clusters
     */
    rollingIndexes: boolean;
  };
}

export interface ConnectionInfo {
  /**
   * Unique ID of the connection.
   */
  readonly id: string;

  /**
   * Date and time when the connection was last used, i.e. connected with.
   */
  lastUsed?: Date;

  /**
   * If present the connection is marked as a favorite by the user.
   */
  favorite?: ConnectionFavoriteOptions;

  /**
   * Saved connection type. Legacy favorite connections will be mapped as
   * 'favorite'
   */
  savedConnectionType?: 'favorite' | 'recent';

  /**
   * The options used to connect
   */
  connectionOptions: ConnectionOptions;

  /**
   * The metadata for the Atlas cluster. Set from Atlas control plane when using compass-web.
   */
  atlasMetadata?: AtlasClusterMetadata;
}

export interface ConnectionFavoriteOptions {
  /**
   * User-defined name of the connection.
   */
  name: string;

  /**
   * Hex-code of the user-defined color.
   */
  color?: string;
}
