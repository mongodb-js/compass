import {
  type ConnectionStorage,
  type ConnectionInfo,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';

export class CompassWebConnectionStorage
  extends InMemoryConnectionStorage
  implements ConnectionStorage
{
  private autoConnectInfo: ConnectionInfo | null = null;
  constructor(
    private readonly _getAutoConnectInfo: () => Promise<ConnectionInfo>
  ) {
    super();
  }

  async getAutoConnectInfo(): Promise<ConnectionInfo | undefined> {
    return await this._getAutoConnectInfo();
  }

  async loadAll(): Promise<ConnectionInfo[]> {
    if (this.autoConnectInfo === null) {
      this.autoConnectInfo = await this._getAutoConnectInfo();
    }
    return [this.autoConnectInfo];
  }

  async load({ id }: { id: string }): Promise<ConnectionInfo | undefined> {
    if (this.autoConnectInfo === null) {
      this.autoConnectInfo = await this._getAutoConnectInfo();
    }
    if (id === this.autoConnectInfo.id) {
      return this.autoConnectInfo;
    }
  }
}
