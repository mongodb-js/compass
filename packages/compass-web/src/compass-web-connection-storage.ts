import {
  type ConnectionStorage,
  type ConnectionInfo,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';

export class CompassWebConnectionStorage
  extends InMemoryConnectionStorage
  implements ConnectionStorage
{
  constructor(
    private readonly getAutoConnectInfo: () => Promise<ConnectionInfo>
  ) {
    super();
  }

  async loadAll(): Promise<ConnectionInfo[]> {
    const connectionInfo = await this.getAutoConnectInfo();
    return [connectionInfo];
  }
}
