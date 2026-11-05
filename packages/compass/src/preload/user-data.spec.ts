import { expect } from 'chai';
import sinon from 'sinon';
import { USER_DATA_CHANNEL } from '@mongodb-js/compass-utils';
import { exposeUserDataBridge } from './user-data';

describe('exposeUserDataBridge', function () {
  const request = { method: 'GET', url: 'compass-user-data://local/Users' };
  let ipcRenderer: { invoke: sinon.SinonStub };
  let contextBridge: { exposeInMainWorld: sinon.SinonStub };

  beforeEach(function () {
    ipcRenderer = {
      invoke: sinon.stub().resolves({ status: 200, body: '[]' }),
    };
    contextBridge = { exposeInMainWorld: sinon.stub() };
  });

  it('forwards bridge requests to main', async function () {
    const target = {} as Window & { compassUserData?: unknown };
    exposeUserDataBridge(target, ipcRenderer, contextBridge, false);

    const response = await (
      target.compassUserData as {
        request(r: typeof request): Promise<unknown>;
      }
    ).request(request);

    expect(response).to.deep.equal({ status: 200, body: '[]' });
    expect(ipcRenderer.invoke).to.have.been.calledOnceWithExactly(
      USER_DATA_CHANNEL,
      request
    );
    expect(contextBridge.exposeInMainWorld).to.not.have.been.called;
  });

  it('exposes the bridge through the context bridge when isolated', function () {
    const target = {} as Window;
    exposeUserDataBridge(target, ipcRenderer, contextBridge, true);

    expect(contextBridge.exposeInMainWorld).to.have.been.calledOnceWith(
      'compassUserData'
    );
    expect(target).to.not.have.property('compassUserData');
  });
});
