import type { SinonStub } from 'sinon';
import sinon from 'sinon';

import { setupIntercom } from './setup-intercom';
import { expect } from 'chai';
import type { IntercomScript } from './intercom-script';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Preferences = require('compass-preferences-model');

async function testRunSetupIntercom(
  initialEnableFeedbackPanel: boolean,
  user: {
    id: string;
    createdAt: Date;
  }
) {
  const intercomScript = {
    load: sinon.spy(),
    unload: sinon.spy(),
  };

  const preferences = new Preferences({
    _id: Date.now().toString(),
    enableFeedbackPanel: initialEnableFeedbackPanel,
  });

  sinon.spy(preferences, 'getPreferenceValue');

  await setupIntercom(
    user,
    intercomScript as unknown as IntercomScript
  );
  return { intercomScript, preferences };
}

const mockUser = {
  id: 'user-123',
  createdAt: new Date(1649432549945),
};

describe('setupIntercom', function () {
  let backupEnv;
  let fetchMock: SinonStub;
  beforeEach(function () {
    backupEnv = {
      HADRON_ISOLATED: process.env.HADRON_ISOLATED,
      HADRON_METRICS_INTERCOM_APP_ID:
        process.env.HADRON_METRICS_INTERCOM_APP_ID,
      HADRON_PRODUCT_NAME: process.env.HADRON_PRODUCT_NAME,
      HADRON_APP_VERSION: process.env.HADRON_APP_VERSION,
      NODE_ENV: process.env.NODE_ENV,
    };

    process.env.HADRON_PRODUCT_NAME = 'My App Name';
    process.env.HADRON_APP_VERSION = 'v0.0.0-test.123';
    process.env.NODE_ENV = 'test';
    process.env.HADRON_ISOLATED = 'false';
    process.env.HADRON_METRICS_INTERCOM_APP_ID = 'appid123';
    fetchMock = sinon.stub(window, 'fetch');
    // NOTE: we use 301 since intercom will redirects
    // to the actual location of the widget script
    fetchMock.resolves(new Response('', { status: 301 }));
  });

  afterEach(function () {
    process.env.HADRON_ISOLATED = backupEnv.HADRON_ISOLATED;
    process.env.HADRON_METRICS_INTERCOM_APP_ID =
      backupEnv.HADRON_METRICS_INTERCOM_APP_ID;
    process.env.HADRON_PRODUCT_NAME = backupEnv.HADRON_PRODUCT_NAME;
    process.env.HADRON_APP_VERSION = backupEnv.HADRON_APP_VERSION;
    process.env.NODE_ENV = backupEnv.NODE_ENV;
    fetchMock.restore();
  });

  describe('when it can be enabled', function () {
    describe('when enableFeedbackPanel is initially enabled', function () {
      it('calls intercomScript.load right away and calls intercomScript.unload when feedback gets disabled', async function () {
        const { intercomScript, preferences } = await testRunSetupIntercom(
          true,
          mockUser
        );

        expect(preferences.getPreferenceValue).to.have.been.calledWith(
          'enableFeedbackPanel'
        );

        expect(intercomScript.load).to.have.been.calledWith({
          app_id: 'appid123',
          app_name: 'My App Name',
          app_stage: 'test',
          app_version: 'v0.0.0-test.123',
          created_at: 1649432549,
          user_id: 'user-123',
        });

        expect(intercomScript.unload).not.to.have.been.called;
        preferences.savePreferences({ enableFeedbackPanel: false });
        expect(intercomScript.unload).to.have.been.called;
      });
    });

    describe('when enableFeedbackPanel is initially disabled', function () {
      it('does not call intercomScript.load right away and calls intercomScript.load when feedback gets enabled', async function () {
        const { intercomScript, preferences } = await testRunSetupIntercom(
          false,
          mockUser
        );

        expect(preferences.getPreferenceValue).to.have.been.calledWith(
          'enableFeedbackPanel'
        );

        expect(intercomScript.load).to.not.have.been.called;

        preferences.savePreferences({ enableFeedbackPanel: true });
        expect(intercomScript.load).to.have.been.calledWith({
          app_id: 'appid123',
          app_name: 'My App Name',
          app_stage: 'test',
          app_version: 'v0.0.0-test.123',
          created_at: 1649432549,
          user_id: 'user-123',
        });
      });
    });
  });

  describe('when cannot be enabled', function () {
    async function expectSetupGetsSkipped() {
      const { intercomScript, preferences } = await testRunSetupIntercom(
        true,
        mockUser
      );

      expect(preferences.getPreferenceValue).not.to.have.been.calledWith(
        'enableFeedbackPanel'
      );

      expect(intercomScript.load).to.not.have.been.called;

      preferences.savePreferences({ enableFeedbackPanel: true });
      expect(preferences.getPreferenceValue).not.to.have.been.calledWith(
        'enableFeedbackPanel'
      );

      expect(intercomScript.load).to.not.have.been.called;
    }

    it('will not enable the script when is compass isolated', async function () {
      process.env.HADRON_ISOLATED = 'true';
      await expectSetupGetsSkipped();
    });

    it('will not enable the script when INTERCOM_APP_ID is not set', async function () {
      process.env.HADRON_METRICS_INTERCOM_APP_ID = '';
      await expectSetupGetsSkipped();
    });

    it('will not enable the script when intercom is unreachable', async function () {
      fetchMock.resolves(new Response('', { status: 500 }));
      await expectSetupGetsSkipped();
    });
  });
});
