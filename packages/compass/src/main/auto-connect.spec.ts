import sinon from 'sinon';
import { expect } from 'chai';
import preferences from 'compass-preferences-model';
import type { AutoConnectPreferences } from './auto-connect';
import {
  resetForTesting,
  registerMongoDbUrlForBrowserWindow,
  getWindowAutoConnectPreferences,
  onCompassDisconnect,
} from './auto-connect';

describe('auto connect management', function () {
  let sandbox: sinon.SinonSandbox;
  let fakePreferences: Omit<AutoConnectPreferences, 'shouldAutoConnect'>;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    resetForTesting();
    fakePreferences = {
      file: '<filename>',
      positionalArguments: ['<arg>'],
      passphrase: '',
      username: '',
      password: '',
    };
    sandbox
      .stub(preferences, 'getPreferences')
      .callsFake(() => fakePreferences as any);
  });

  afterEach(function () {
    sandbox.restore();
    resetForTesting();
  });

  it('should indicate to the first window that it is supposed to auto-connect', function () {
    expect(getWindowAutoConnectPreferences({ id: 1 })).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(getWindowAutoConnectPreferences({ id: 1 })).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(getWindowAutoConnectPreferences({ id: 2 })).to.deep.equal({
      shouldAutoConnect: false,
    });
  });

  it('should allow specifying a fixed url for a browser window', function () {
    registerMongoDbUrlForBrowserWindow({ id: 2 }, 'mongodb://foo');
    expect(getWindowAutoConnectPreferences({ id: 2 })).to.deep.equal({
      positionalArguments: ['mongodb://foo'],
      shouldAutoConnect: true,
    });
  });

  it('should not indicate to a window that it should auto-connect if it has ever disconnected', function () {
    onCompassDisconnect({ id: 1 });
    expect(getWindowAutoConnectPreferences({ id: 1 })).to.deep.equal({
      shouldAutoConnect: false,
    });
    registerMongoDbUrlForBrowserWindow({ id: 2 }, 'mongodb://foo');
    onCompassDisconnect({ id: 2 });
    expect(getWindowAutoConnectPreferences({ id: 2 })).to.deep.equal({
      shouldAutoConnect: false,
    });
  });

  it('should ignore about: urls', function () {
    fakePreferences = { positionalArguments: ['about:blank'] };
    expect(getWindowAutoConnectPreferences({ id: 1 })).to.deep.equal({
      shouldAutoConnect: false,
    });
  });

  it('should not auto-connect if no args were passed', function () {
    fakePreferences = { positionalArguments: [] };
    expect(getWindowAutoConnectPreferences({ id: 1 })).to.deep.equal({
      shouldAutoConnect: false,
    });
  });
});
