/* eslint-disable @typescript-eslint/no-require-imports */
import type { SinonStub } from 'sinon';
import sinon from 'sinon';

import { setupIntercom } from './setup-intercom';
import { expect } from 'chai';
import type { IntercomScript } from './intercom-script';
import type { PreferencesAccess } from 'compass-preferences-model';
import {
  createSandboxFromDefaultPreferences,
  type User,
} from 'compass-preferences-model';

const mockUser: User = {
  id: 'user-123',
  createdAt: new Date(1649432549945),
  lastUsed: new Date(1649432549945),
};

describe('setupIntercom', function () {
  let backupEnv: Partial<typeof process.env>;
  let fetchMock: SinonStub;
  let preferences: PreferencesAccess;

  async function testRunSetupIntercom() {
    const intercomScript = {
      load: sinon.spy(),
      unload: sinon.spy(),
    };
    await setupIntercom(
      preferences,
      intercomScript as unknown as IntercomScript
    );
    return { intercomScript };
  }

  beforeEach(async function () {
    backupEnv = {
      HADRON_METRICS_INTERCOM_APP_ID:
        process.env.HADRON_METRICS_INTERCOM_APP_ID,
      HADRON_PRODUCT_NAME: process.env.HADRON_PRODUCT_NAME,
      HADRON_APP_VERSION: process.env.HADRON_APP_VERSION,
      NODE_ENV: process.env.NODE_ENV,
    };

    process.env.HADRON_PRODUCT_NAME = 'My App Name' as any;
    process.env.HADRON_APP_VERSION = 'v0.0.0-test.123';
    process.env.NODE_ENV = 'test';
    process.env.HADRON_METRICS_INTERCOM_APP_ID = 'appid123';
    fetchMock = sinon.stub();
    window.fetch = fetchMock;
    // NOTE: we use 301 since intercom will redirects
    // to the actual location of the widget script
    fetchMock.resolves({ status: 301 } as Response);
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableFeedbackPanel: true,
      telemetryAnonymousId: mockUser.id,
      userCreatedAt: mockUser.createdAt.getTime(),
    });
  });

  afterEach(function () {
    process.env.HADRON_METRICS_INTERCOM_APP_ID =
      backupEnv.HADRON_METRICS_INTERCOM_APP_ID;
    process.env.HADRON_PRODUCT_NAME = backupEnv.HADRON_PRODUCT_NAME as any;
    process.env.HADRON_APP_VERSION = backupEnv.HADRON_APP_VERSION as any;
    process.env.NODE_ENV = backupEnv.NODE_ENV;
    fetchMock.reset();
  });

  describe('when it can be enabled', function () {
    it('calls intercomScript.load when feedback gets enabled and intercomScript.unload when feedback gets disabled', async function () {
      await preferences.savePreferences({
        enableFeedbackPanel: true,
      });
      const { intercomScript } = await testRunSetupIntercom();

      expect(intercomScript.load).to.have.been.calledWith({
        app_id: 'appid123',
        app_name: 'My App Name',
        app_stage: 'test',
        app_version: 'v0.0.0-test.123',
        created_at: 1649432549,
        user_id: 'user-123',
      });

      await preferences.savePreferences({
        enableFeedbackPanel: false,
      });

      expect(intercomScript.unload).to.have.been.called;
    });

    it('calls intercomScript.unload when feedback gets disabled', async function () {
      await preferences.savePreferences({
        enableFeedbackPanel: false,
      });
      const { intercomScript } = await testRunSetupIntercom();
      expect(intercomScript.load).not.to.have.been.called;
      expect(intercomScript.unload).to.have.been.called;
    });
  });

  describe('when cannot be enabled', function () {
    async function expectSetupGetsSkipped() {
      const { intercomScript } = await testRunSetupIntercom();

      expect(intercomScript.load).to.not.have.been.called;

      await preferences.savePreferences({
        enableFeedbackPanel: true,
      });

      expect(intercomScript.load).to.not.have.been.called;
    }

    it('will not enable the script when is compass isolated', async function () {
      await preferences.savePreferences({
        networkTraffic: false,
      });
      await expectSetupGetsSkipped();
    });

    it('will not enable the script when INTERCOM_APP_ID is not set', async function () {
      process.env.HADRON_METRICS_INTERCOM_APP_ID = '';
      await expectSetupGetsSkipped();
    });

    it('will not enable the script when intercom is unreachable', async function () {
      fetchMock.resolves({ status: 500 } as Response);
      await expectSetupGetsSkipped();
    });
  });
});
