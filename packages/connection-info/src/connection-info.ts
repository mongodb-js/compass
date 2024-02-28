import type { ConnectionOptions } from 'mongodb-data-service';

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
   * Saved connection type. Legacy favorite connections will be mapped as 'favorite'.
   */
  savedConnectionType?: 'favorite' | 'recent';

  /**
   * The options used to connect
   */
  connectionOptions: ConnectionOptions;
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

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'failed';
