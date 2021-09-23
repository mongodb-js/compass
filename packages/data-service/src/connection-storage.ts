import Ajv, { JTDSchemaType } from 'ajv/dist/jtd';
import { validate as uuidValidate } from 'uuid';
import path from 'path';

import { ConnectionInfo } from './connection-info';
import { UserData } from './user-data';

type ConnectionInfoWithId = ConnectionInfo &
  Required<Pick<ConnectionInfo, 'id'>>;

const SCHEMA_VERSION = 1;
const CONNECTIONS_SUB_DIR = path.join('connections', `v${SCHEMA_VERSION}`);

const schema: JTDSchemaType<ConnectionInfoWithId> = {
  properties: {
    id: {
      type: 'string',
    },
    connectionOptions: {
      properties: {
        connectionString: {
          type: 'string',
        },
      },
      optionalProperties: {
        tlsCertificateFile: {
          type: 'string',
        },
        sshTunnel: {
          properties: {
            host: {
              type: 'string',
            },
            port: {
              type: 'int32',
            },
            username: {
              type: 'string',
            },
          },
          optionalProperties: {
            identityKeyFile: {
              type: 'string',
            },
            identityKeyPassphrase: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
          },
        },
      },
    },
  },
  optionalProperties: {
    lastUsed: {
      type: 'timestamp',
    },
    favorite: {
      properties: {
        name: {
          type: 'string',
        },
      },
      optionalProperties: {
        color: {
          type: 'string',
        },
      },
    },
  },
};

export class ConnectionStorage {
  private _userData: UserData<ConnectionInfoWithId>;

  constructor() {
    const ajv = new Ajv();
    const serialize = ajv.compileSerializer(schema);
    const parse = ajv.compileParser(schema);

    this._userData = new UserData<ConnectionInfoWithId>({
      subDir: CONNECTIONS_SUB_DIR,
      parse,
      serialize,
    });
  }

  /**
   * Loads all the ConnectionInfo currently stored.
   *
   * @returns Promise<ConnectionInfo[]>
   */
  async loadAll(): Promise<ConnectionInfoWithId[]> {
    return await this._userData.readAll('*.json');
  }

  /**
   * Inserts or replaces a ConnectionInfo object in the storage.
   *
   * The ConnectionInfo object must have an id set to a string
   * matching the uuid format.
   *
   * @param connectionInfo - The ConnectionInfo object to be saved.
   */
  async save(connectionInfo: ConnectionInfoWithId): Promise<void> {
    if (!uuidValidate(connectionInfo.id)) {
      throw new Error('id must be a uuid');
    }

    await this._userData.write(
      this._idToFile(connectionInfo.id),
      connectionInfo
    );
  }

  /**
   * Deletes a ConnectionInfo object from the storage.
   *
   * If the ConnectionInfo does not have an id, the operation will
   * ignore and return.
   *
   * Trying to remove a ConnectionInfo that is not stored has no effect
   * and won't throw an exception.
   *
   * @param connectionInfo - The ConnectionInfo object to be deleted.
   */
  async delete(connectionInfo: ConnectionInfoWithId): Promise<void> {
    if (!connectionInfo.id) {
      // don't throw attempting to delete an invalid connection.
      return;
    }

    await this._userData.delete(this._idToFile(connectionInfo.id));
  }

  private _idToFile(id: string): string {
    return path.join(`${id}.json`);
  }
}
