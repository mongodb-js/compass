import { expect } from 'chai';
import sinon from 'sinon';
import { exposeAppInfo, userDataPathArgument } from './app-info';

const info = { userDataPath: '/tmp/MongoDB Compass' };

describe('exposeAppInfo', function () {
  it('exposes the app info through the context bridge when isolated', function () {
    const target = {} as Window;
    const contextBridge = { exposeInMainWorld: sinon.spy() };
    exposeAppInfo(
      target,
      [userDataPathArgument(info.userDataPath)],
      contextBridge,
      true
    );
    expect(contextBridge.exposeInMainWorld).to.have.been.calledOnceWith(
      'compassApp',
      info
    );
    expect(target).to.not.have.property('compassApp');
  });

  it('assigns the app info to the window when not isolated', function () {
    const target = {} as Window;
    const contextBridge = { exposeInMainWorld: sinon.spy() };
    exposeAppInfo(
      target,
      ['--other', userDataPathArgument(info.userDataPath)],
      contextBridge,
      false
    );
    expect(target.compassApp).to.deep.equal(info);
    expect(contextBridge.exposeInMainWorld).to.not.have.been.called;
  });

  it('throws when main did not pass the argument', function () {
    expect(() =>
      exposeAppInfo({} as Window, [], { exposeInMainWorld: sinon.spy() }, false)
    ).to.throw(Error, 'Missing --compass-user-data-path= preload argument');
  });
});
