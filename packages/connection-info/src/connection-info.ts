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
   * Favourite information. We keep it so we don't have to change the connection storage.
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
  name: string;
  color?: string;
}

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'failed';
