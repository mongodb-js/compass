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
   * True if the connection is marked as favorite.
   */
  readonly userFavorite?: boolean;

  /**
   * Name of the connection.
   */
  readonly name?: string;

  /**
   * Colour of the connection, if any;
   */
  readonly color?: string;

  /**
   * Legacy favourite information
   */
  readonly favorite?: ConnectionFavoriteOptions;
  /**
   * The options used to connect
   */
  connectionOptions: ConnectionOptions;
}

interface ConnectionFavoriteOptions {
  readonly name: string;
  readonly color?: string;
}
