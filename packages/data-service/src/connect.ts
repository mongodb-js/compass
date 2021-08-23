import util from 'util';
import { ConnectionOptions } from './connection-options';

import DataService from './data-service';
import { LegacyConnectionModel } from './legacy-connection-model';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConnectionModel = require('mongodb-connection-model');

const connectionFromUri = util.promisify(
  ConnectionModel.from.bind(ConnectionModel)
);

export default async function connect(
  connectionOptions: ConnectionOptions
): Promise<DataService> {
  const connectionModel: LegacyConnectionModel = await connectionFromUri(
    connectionOptions.connectionString
  );

  if (!connectionOptions.sshTunnel) {
    connectionModel.sshTunnel = 'NONE';
  } else if (connectionOptions.sshTunnel.password) {
    connectionModel.sshTunnel = 'USER_PASSWORD';
  } else if (connectionOptions.sshTunnel.privateKey) {
    connectionModel.sshTunnel = 'IDENTITY_FILE';
  }

  const dataService = new DataService(connectionModel);

  await util.promisify(dataService.connect.bind(dataService))();

  return dataService;
}
