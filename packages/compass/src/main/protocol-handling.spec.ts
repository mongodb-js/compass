/* eslint-disable @typescript-eslint/unbound-method */
import sinon from 'sinon';
import { app } from 'electron';
import { expect } from 'chai';
import preferences from 'compass-preferences-model';
import { setupProtocolHandlers } from './protocol-handling';

describe('auto connect management', function () {
  let sandbox: sinon.SinonSandbox;
  let preferencesSandbox: typeof preferences;
  const protocols = [
    { name: 'A', schemes: ['a', 'b'] },
    { name: 'C', schemes: ['c'] },
  ];

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    preferencesSandbox = await preferences.createSandbox();
    sandbox.stub(app, 'setAsDefaultProtocolClient');
    sandbox.stub(app, 'removeAsDefaultProtocolClient');
    sandbox.stub(process, 'platform').value('linux');
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('installs protocol handlers as expected', async function () {
    await setupProtocolHandlers('install', preferencesSandbox, protocols);
    expect(app.setAsDefaultProtocolClient).to.have.been.calledThrice;
    expect(app.setAsDefaultProtocolClient).to.have.been.calledWithMatch('a');
    expect(app.setAsDefaultProtocolClient).to.have.been.calledWithMatch('b');
    expect(app.setAsDefaultProtocolClient).to.have.been.calledWithMatch('c');
    expect(app.removeAsDefaultProtocolClient).to.not.have.been.called;
  });

  it('skips installing if preferences indicate not to', async function () {
    await preferencesSandbox.savePreferences({ installURLHandlers: false });
    await setupProtocolHandlers('install', preferencesSandbox, protocols);
    expect(app.setAsDefaultProtocolClient).to.not.have.been.called;
    expect(app.removeAsDefaultProtocolClient).to.not.have.been.called;
  });

  it('uninstalls protocol handlers if requested', async function () {
    await setupProtocolHandlers('uninstall', preferencesSandbox, protocols);
    expect(app.removeAsDefaultProtocolClient).to.have.been.calledThrice;
    expect(app.removeAsDefaultProtocolClient).to.have.been.calledWithMatch('a');
    expect(app.removeAsDefaultProtocolClient).to.have.been.calledWithMatch('b');
    expect(app.removeAsDefaultProtocolClient).to.have.been.calledWithMatch('c');
    expect(app.setAsDefaultProtocolClient).to.not.have.been.called;
  });

  it('uninstalls protocol handlers if preferences change', async function () {
    await preferencesSandbox.savePreferences({ installURLHandlers: true });
    await setupProtocolHandlers('install', preferencesSandbox, protocols);
    await preferencesSandbox.savePreferences({ installURLHandlers: false });
    expect(app.removeAsDefaultProtocolClient).to.have.been.calledThrice;
    sandbox.resetHistory();
    await preferencesSandbox.savePreferences({ installURLHandlers: true });
    expect(app.setAsDefaultProtocolClient).to.have.been.calledThrice;
  });
});
