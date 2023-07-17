/* eslint-disable @typescript-eslint/no-var-requires */
import type { SinonStub } from 'sinon';
import sinon from 'sinon';

import { setupIntercom } from './setup-intercom';
import { expect } from 'chai';
import type { IntercomScript } from './intercom-script';
import preferences, { type User } from 'compass-preferences-model';

const setupIpc = () => {
  let savedPreferences = {};
  Object.assign(require('hadron-ipc').ipcRenderer, {
    invoke: async (name: string, attributes: any) => {
      if (name === 'compass:save-preferences') {
        savedPreferences = { ...savedPreferences, ...attributes };
        await preferences.refreshPreferences();
      } else if (name === 'test:clear-preferences') {
        savedPreferences = {};
        await preferences.refreshPreferences();
      }
      return savedPreferences;
    },
  });
};

async function testRunSetupIntercom(user: User) {
  const intercomScript = {
    load: sinon.spy(),
    unload: sinon.spy(),
  };
  await setupIntercom(user, intercomScript as unknown as IntercomScript);
  return { intercomScript };
}

const mockUser: User = {
  id: 'user-123',
  createdAt: new Date(1649432549945),
  lastUsed: new Date(1649432549945),
};

describe('setupIntercom', function () {
  let backupEnv: Partial<typeof process.env>;
  let fetchMock: SinonStub;

  before(function () {
    setupIpc();
  });

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
    fetchMock = sinon.stub(window, 'fetch');
    // NOTE: we use 301 since intercom will redirects
    // to the actual location of the widget script
    fetchMock.resolves(new Response('', { status: 301 }));

    await require('hadron-ipc').ipcRenderer.invoke('test:clear-preferences');
    await require('hadron-ipc').ipcRenderer.invoke('compass:save-preferences', {
      enableFeedbackPanel: true,
    });
  });

  afterEach(function () {
    process.env.HADRON_METRICS_INTERCOM_APP_ID =
      backupEnv.HADRON_METRICS_INTERCOM_APP_ID;
    process.env.HADRON_PRODUCT_NAME = backupEnv.HADRON_PRODUCT_NAME as any;
    process.env.HADRON_APP_VERSION = backupEnv.HADRON_APP_VERSION as any;
    process.env.NODE_ENV = backupEnv.NODE_ENV;
    fetchMock.restore();
  });

  describe('when it can be enabled', function () {
    it('calls intercomScript.load when feedback gets enabled and intercomScript.unload when feedback gets disabled', async function () {
      await require('hadron-ipc').ipcRenderer.invoke(
        'compass:save-preferences',
        {
          enableFeedbackPanel: true,
        }
      );
      const { intercomScript } = await testRunSetupIntercom(mockUser);

      expect(intercomScript.load).to.have.been.calledWith({
        app_id: 'appid123',
        app_name: 'My App Name',
        app_stage: 'test',
        app_version: 'v0.0.0-test.123',
        created_at: 1649432549,
        user_id: 'user-123',
      });

      await require('hadron-ipc').ipcRenderer.invoke(
        'compass:save-preferences',
        {
          enableFeedbackPanel: false,
        }
      );
      await require('hadron-ipc').ipcRenderer.emit(
        'compass:preferences-changed',
        {},
        {
          enableFeedbackPanel: false,
        }
      );

      expect(intercomScript.unload).to.have.been.called;
    });

    it('calls intercomScript.unload when feedback gets disabled', async function () {
      await require('hadron-ipc').ipcRenderer.invoke(
        'compass:save-preferences',
        {
          enableFeedbackPanel: false,
        }
      );
      const { intercomScript } = await testRunSetupIntercom(mockUser);
      expect(intercomScript.load).not.to.have.been.called;
      expect(intercomScript.unload).to.have.been.called;
    });
  });

  describe('when cannot be enabled', function () {
    async function expectSetupGetsSkipped() {
      const { intercomScript } = await testRunSetupIntercom(mockUser);

      expect(intercomScript.load).to.not.have.been.called;

      await require('hadron-ipc').ipcRenderer.invoke(
        'compass:save-preferences',
        {
          enableFeedbackPanel: true,
        }
      );

      expect(intercomScript.load).to.not.have.been.called;
    }

    it('will not enable the script when is compass isolated', async function () {
      await require('hadron-ipc').ipcRenderer.invoke(
        'compass:save-preferences',
        {
          enableFeedbackPanel: false,
        }
      );
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
