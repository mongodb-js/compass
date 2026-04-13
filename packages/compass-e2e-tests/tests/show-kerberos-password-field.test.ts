import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors.ts';
import type { ConnectFormState } from '../helpers/connect-form-state.ts';

describe('showKerberosPasswordField', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(
      this,
      'kerberos authentication type is not supported in compass-web'
    );

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
  });

  beforeEach(async function () {
    await browser.setFeature('showKerberosPasswordField', false);
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
  });

  afterEach(async function () {
    await browser.setFeature('showKerberosPasswordField', false);
    await screenshotIfFailed(compass, this.currentTest);
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
      await browser.$(Selectors.ConnectionFormStringInput).getValue()
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
      await browser.$(Selectors.ConnectionFormStringInput).getValue()
    ).to.equal(
      'mongodb://localhost:27017/?authMechanism=GSSAPI&authSource=%24external'
    );

    const connectFormState = await compass.browser.getConnectFormState();
    expect(connectFormState.kerberosProvidePassword).to.equal(false);
  });
});
