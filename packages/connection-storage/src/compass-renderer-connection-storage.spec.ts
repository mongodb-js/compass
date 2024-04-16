import sinon from 'sinon';
import {
  CompassRendererConnectionStorage,
  type ConnectionStorageIPCInterface,
  type ConnectionStorageIPCRenderer,
} from './compass-renderer-connection-storage';
import { TEST_CONNECTION_INFO } from '@mongodb-js/compass-connections/provider';
import { expect } from 'chai';

describe('CompassRendererConnectionStorage', function () {
  describe('getAutoConnectInfo', function () {
    it('should not return an autoConnectInfo once it has been requested already', async function () {
      const getAutoConnectInfo = sinon.stub().resolves(TEST_CONNECTION_INFO);
      const ipcStub: ConnectionStorageIPCRenderer = <
        ConnectionStorageIPCRenderer
      >{
        createInvoke() {
          return {
            getAutoConnectInfo,
          } as unknown as ConnectionStorageIPCInterface;
        },
        async call() {},
      };
      const storage = new CompassRendererConnectionStorage(ipcStub);
      expect(await storage.getAutoConnectInfo()).to.deep.equal(
        TEST_CONNECTION_INFO
      );
      expect(await storage.getAutoConnectInfo()).to.be.undefined;
    });
  });
});
