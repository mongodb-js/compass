import type { ConnectionOptions } from 'mongodb-data-service';

export interface AtlasClusterMetadata {
  orgId: string;
  /**
   * Project ID that uniquely identifies an Atlas project. Legacy name is "groupId"
   * as projects were previously identified as "groups".
   * https://www.mongodb.com/docs/atlas/api/atlas-admin-api-ref/#project-id
   */
  projectId: string;
  clusterId: string;
  clusterName: string;
  clusterType: 'host' | 'replicaSet' | 'cluster' | 'serverless';
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
