import type { ConnectionOptions } from 'mongodb-data-service';

export interface AtlasClusterMetadata {
  orgId: string;
  /**
   * Project ID that uniquely identifies an Atlas project. Legacy name is "groupId"
   * as projects were previously identified as "groups".
   * https://www.mongodb.com/docs/atlas/api/atlas-admin-api-ref/#project-id
   */
  projectId: string;
  /**
   * Cluster name, unique inside same project
   */
  clusterName: string;
  /**
   * A special id and type that are only relevant in context of mms metrics
   * features. These are deployment items props (with a special exception for
   * serverless, where id is just name, and type is `serverless` that doesn't
   * make sense in context of deployments), not cluster description props.

   * https://github.com/10gen/mms/blob/43b0049a85196b44e465feb9b96ef942d6f2c8f4/client/js/legacy/core/models/deployment
   */
  metricsId: string;
  metricsType: 'host' | 'replicaSet' | 'cluster' | 'serverless';
  /**
   * Atlas API base url to be used when connecing to a regionalized cluster
   */
  regionalBaseUrl: string;
  /*
   * At the time of writing these are the possible instance sizes. If we include
   * the list in the type here , then we'll have to maintain it..
   * https://github.com/10gen/mms/blob/9e6bf2d81d4d85b5ac68a15bf471dcddc5922323/client/packages/types/nds/provider.ts#L60-L107
   */
  instanceSize?: string;
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
   * The metdata for the Atlas cluster
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
