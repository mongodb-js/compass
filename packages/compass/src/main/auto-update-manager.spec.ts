import { setTimeout as wait } from 'timers/promises';
import { expect } from 'chai';
import Sinon from 'sinon';
import {
  AutoUpdateManagerState,
  CompassAutoUpdateManager,
} from './auto-update-manager';
import autoUpdater from './auto-updater';
import type { DownloadItem } from 'electron';
import { dialog } from 'electron';
import os from 'os';
import dl from 'electron-dl';

CompassAutoUpdateManager.autoUpdateOptions = {
  endpoint: 'http://example.com',
  platform: 'darwin',
  arch: 'x64',
  product: 'compass',
  channel: 'dev',
  version: '0.0.0',
  updateCheckInterval: 0,
  initialUpdateDelay: 0,
};

function setStateAndWaitForUpdate(
  initial: AutoUpdateManagerState,
  setTo: AutoUpdateManagerState,
  expected: AutoUpdateManagerState,
  timeout = 5_000
): Promise<true> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    function resolveWhenState(newState: any) {
      if (newState === expected) {
        resolved = true;
        CompassAutoUpdateManager.off('new-state', resolveWhenState);
        CompassAutoUpdateManager['currentStateTransition']?.finally(() => {
          CompassAutoUpdateManager['currentActionAbortController'].abort();
          resolve(true);
        });
      }
    }
    CompassAutoUpdateManager['state'] = initial;
    CompassAutoUpdateManager.setState(setTo, {});
    CompassAutoUpdateManager.on('new-state', resolveWhenState);
    void wait(timeout).then(() => {
      if (resolved) {
        return;
      }
      CompassAutoUpdateManager.off('new-state', resolveWhenState);
      reject(
        new Error(
          `Expected state to be "${expected}" got "${CompassAutoUpdateManager['state']}"`
        )
      );
    });
  });
}

describe('CompassAutoUpdateManager', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    sandbox.restore();
    CompassAutoUpdateManager['state'] = AutoUpdateManagerState.Initial;
    CompassAutoUpdateManager['currentStateTransition'] = undefined;
    CompassAutoUpdateManager['currentActionAbortController'] =
      new AbortController();
  });

  it('should not allow undefined state transitions', function () {
    const initialState = CompassAutoUpdateManager['state'];
    CompassAutoUpdateManager.setState(AutoUpdateManagerState.ReadyToUpdate);
    expect(CompassAutoUpdateManager['state']).to.eq(initialState);
    CompassAutoUpdateManager.setState(AutoUpdateManagerState.Restarting);
    expect(CompassAutoUpdateManager['state']).to.eq(initialState);
    CompassAutoUpdateManager.setState(AutoUpdateManagerState.NoUpdateAvailable);
    expect(CompassAutoUpdateManager['state']).to.eq(initialState);
  });

  describe('when checking for update', function () {
    beforeEach(function () {
      sandbox.stub(dialog, 'showMessageBox').callsFake(() => {
        return new Promise(() => {});
      });
      sandbox.stub(autoUpdater);
    });

    it('should check for update and transition to update not available if backend returned nothing', async function () {
      const stub = sandbox
        .stub(CompassAutoUpdateManager, 'checkForUpdate')
        .callsFake(() => {
          return Promise.resolve(null);
        });

      expect(
        await setStateAndWaitForUpdate(
          AutoUpdateManagerState.Initial,
          AutoUpdateManagerState.CheckingForUpdates,
          AutoUpdateManagerState.NoUpdateAvailable
        )
      ).to.eq(true);

      expect(stub).to.be.calledOnce;
    });

    it('should transition to update available if update is available', async function () {
      const stub = sandbox
        .stub(CompassAutoUpdateManager, 'checkForUpdate')
        .callsFake(() => {
          return Promise.resolve({ from: '0.0.0', to: '1.0.0', name: '1.0.0' });
        });

      expect(
        await setStateAndWaitForUpdate(
          AutoUpdateManagerState.Initial,
          AutoUpdateManagerState.CheckingForUpdates,
          AutoUpdateManagerState.UpdateAvailable
        )
      ).to.eq(true);

      expect(stub).to.be.calledOnce;
    });

    it('should abort checking and go to disabled when autoupdate is disabled', async function () {
      const stub = sandbox
        .stub(CompassAutoUpdateManager, 'checkForUpdate')
        .callsFake(() => {
          return wait(100, { from: '0.0.0', to: '1.0.0', name: '1.0.0' });
        });

      CompassAutoUpdateManager.setState(
        AutoUpdateManagerState.CheckingForUpdates
      );
      CompassAutoUpdateManager.setState(AutoUpdateManagerState.Disabled);

      await wait(1000);

      // Check for update returned existing update, but as we disabled in the
      // meantime the state is still disabled and wasn't transitioned
      expect(stub).to.be.calledOnce;
      expect(CompassAutoUpdateManager['state']).to.eq(
        AutoUpdateManagerState.Disabled
      );
    });
  });

  describe('when showing update available dialog to the user', function () {
    beforeEach(function () {
      sandbox.stub(autoUpdater);
    });

    it('should start downloading update if user confirms update install', async function () {
      const stub = sandbox.stub(dialog, 'showMessageBox').callsFake(() => {
        return Promise.resolve({ response: 0, checkboxChecked: false });
      });

      expect(
        await setStateAndWaitForUpdate(
          AutoUpdateManagerState.CheckingForUpdates,
          AutoUpdateManagerState.UpdateAvailable,
          AutoUpdateManagerState.DownloadingUpdate
        )
      ).to.eq(true);

      expect(stub).to.be.calledOnce;
    });

    it('should transition to update dismissed if user cancels the update', async function () {
      const stub = sandbox.stub(dialog, 'showMessageBox').callsFake(() => {
        return Promise.resolve({ response: 1, checkboxChecked: false });
      });

      expect(
        await setStateAndWaitForUpdate(
          AutoUpdateManagerState.CheckingForUpdates,
          AutoUpdateManagerState.UpdateAvailable,
          AutoUpdateManagerState.UpdateDismissed
        )
      ).to.eq(true);

      expect(stub).to.be.calledOnce;
    });

    it('should ignore user input and go to disabled when autoupdate is disabled', async function () {
      const stub = sandbox.stub(dialog, 'showMessageBox').callsFake(() => {
        return wait(100, { response: 0, checkboxChecked: false });
      });

      CompassAutoUpdateManager['state'] =
        AutoUpdateManagerState.CheckingForUpdates;
      CompassAutoUpdateManager.setState(
        AutoUpdateManagerState.UpdateAvailable,
        {}
      );
      CompassAutoUpdateManager.setState(AutoUpdateManagerState.Disabled);

      await wait(1000);

      // Message box returned install update, but as we disabled in the meantime
      // the state is still disabled and wasn't transitioned
      expect(stub).to.be.calledOnce;
      expect(CompassAutoUpdateManager['state']).to.eq(
        AutoUpdateManagerState.Disabled
      );
    });

    describe('when arch is mismatched on darwin', function () {
      beforeEach(function () {
        sandbox.stub(os, 'cpus').callsFake(() => {
          return [{ model: 'Apple' }] as os.CpuInfo[];
        });
        sandbox.stub(process, 'platform').get(() => 'darwin');
        sandbox.stub(process, 'arch').get(() => 'x64');
      });

      it('should start downloading installer if user selects recommended options', async function () {
        sandbox.stub(dialog, 'showMessageBox').callsFake(() => {
          return Promise.resolve({ response: 0, checkboxChecked: false });
        });

        const stub = sandbox.stub(dl, 'download').callsFake(() => {
          return Promise.resolve({} as DownloadItem);
        });

        expect(
          await setStateAndWaitForUpdate(
            AutoUpdateManagerState.CheckingForUpdates,
            AutoUpdateManagerState.UpdateAvailable,
            AutoUpdateManagerState.ManualDownload
          )
        ).to.eq(true);

        expect(stub).to.be.calledOnce;
      });

      it('should start downloading update if user confirms update install', async function () {
        const stub = sandbox.stub(dialog, 'showMessageBox').callsFake(() => {
          return Promise.resolve({ response: 1, checkboxChecked: false });
        });

        expect(
          await setStateAndWaitForUpdate(
            AutoUpdateManagerState.CheckingForUpdates,
            AutoUpdateManagerState.UpdateAvailable,
            AutoUpdateManagerState.DownloadingUpdate
          )
        ).to.eq(true);

        expect(stub).to.be.calledOnce;
      });

      it('should transition to update dismissed if user cancels the update', async function () {
        const stub = sandbox.stub(dialog, 'showMessageBox').callsFake(() => {
          return Promise.resolve({ response: 2, checkboxChecked: false });
        });

        expect(
          await setStateAndWaitForUpdate(
            AutoUpdateManagerState.CheckingForUpdates,
            AutoUpdateManagerState.UpdateAvailable,
            AutoUpdateManagerState.UpdateDismissed
          )
        ).to.eq(true);

        expect(stub).to.be.calledOnce;
      });
    });
  });

  describe('when update is downloaded and ready to install', function () {
    beforeEach(function () {
      sandbox.stub(autoUpdater);
    });

    it('should restart the app if user confirms', async function () {
      const showBoxStub = sandbox
        .stub(dialog, 'showMessageBox')
        .callsFake(() => {
          return Promise.resolve({ response: 0, checkboxChecked: false });
        });

      expect(
        await setStateAndWaitForUpdate(
          AutoUpdateManagerState.DownloadingUpdate,
          AutoUpdateManagerState.ReadyToUpdate,
          AutoUpdateManagerState.Restarting
        )
      ).to.eq(true);

      expect(showBoxStub).to.be.calledOnce;
      expect(autoUpdater.quitAndInstall).to.be.calledOnce;
    });

    it('should transition to restart dismissed if user does not confirm restart', async function () {
      const showBoxStub = sandbox
        .stub(dialog, 'showMessageBox')
        .callsFake(() => {
          return Promise.resolve({ response: 1, checkboxChecked: false });
        });

      expect(
        await setStateAndWaitForUpdate(
          AutoUpdateManagerState.DownloadingUpdate,
          AutoUpdateManagerState.ReadyToUpdate,
          AutoUpdateManagerState.RestartDismissed
        )
      ).to.eq(true);

      expect(showBoxStub).to.be.calledOnce;
    });
  });
});
