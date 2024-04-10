import {
  type ConnectionStorage,
  NoopConnectionStorage,
  type ConnectionInfo,
} from './connection-storage';

export class CompassWebConnectionStorage
  extends NoopConnectionStorage
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
