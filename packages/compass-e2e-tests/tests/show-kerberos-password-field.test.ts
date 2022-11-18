import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors';
import type { ConnectFormState } from '../helpers/connect-form-state';

describe('showKerberosPasswordField', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await browser.setFeature('showKerberosPasswordField', false);
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await browser.setFeature('showKerberosPasswordField', false);
    await afterTest(compass, this.currentTest);
  });

  it('hides the kerberos password field in the connection form', async function () {
    const connectionString = 'mongodb://localhost:27017/';
    const state: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'GSSAPI',
    };
    await browser.setConnectFormState(state);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(
      'mongodb://localhost:27017/?authMechanism=GSSAPI&authSource=%24external'
    );

    const connectFormState = await compass.browser.getConnectFormState();
    expect(connectFormState.kerberosProvidePassword).to.equal(undefined);
  });

  it('shows the kerberos password field in the connection form', async function () {
    await browser.setFeature('showKerberosPasswordField', true);
    const connectionString = 'mongodb://localhost:27017/';
    const state: ConnectFormState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'GSSAPI',
    };
    await browser.setConnectFormState(state);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(
      'mongodb://localhost:27017/?authMechanism=GSSAPI&authSource=%24external'
    );

    const connectFormState = await compass.browser.getConnectFormState();
    expect(connectFormState.kerberosProvidePassword).to.equal(false);
  });
});
