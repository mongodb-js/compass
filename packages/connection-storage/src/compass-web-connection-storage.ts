import {
  type ConnectionStorage,
  type ConnectionInfo,
} from './connection-storage';
import { InMemoryConnectionStorage } from './in-memory-connection-storage';

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
